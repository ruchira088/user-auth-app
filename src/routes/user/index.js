const express = require("express")
const httpStatusCodes = require("http-status-codes")
const userLib = require("../../libs/user")
const {RESPONSES} = require("../../constants/messages")
const {UUID_REGEX} = require("../../constants/general")
const {USER} = require("../../constants/errors")
const {sanitize} = require("../../libs/general")
const {authentication, authorization} = require("../../middleware/security")
const userRouter = require("./user")

const PATH = "/user"

const getRouter = ({redisClient, db}) => {
    const indexRouter = express.Router()

    indexRouter.post("/", ({body}, response) => {
        const {username, password} = body

        userLib.usernameExists(db, username)
            .then(result => {
                if (result === false) {
                    return userLib.createUser(db, {username, password})
                            .then(result => ({
                                result: sanitize(result),
                                status: httpStatusCodes.CREATED
                            }))
                } else {
                    return ({
                        result: `${RESPONSES.USERNAME_EXISTS}: ${username}`,
                        status: httpStatusCodes.CONFLICT
                    })
                }
            })
            .catch(error => ({result: error, status: httpStatusCodes.INTERNAL_SERVER_ERROR}))
            .then(({status, result}) => {
                response.status(status).json(result)
            })
    })

    indexRouter.post("/login", ({body}, response) => {

        userLib.login(db, redisClient, body)
            .then(token => {
                if(token != null) {
                    return {
                        result: token,
                        status: httpStatusCodes.OK
                    }
                } else {
                    return {
                        result: RESPONSES.INVALID_CREDENTIALS,
                        status: httpStatusCodes.UNAUTHORIZED
                    }
                }
            })
            .catch(error => ({result: error, status: httpStatusCodes.INTERNAL_SERVER_ERROR}))
            .then(({status, result}) => {
                response.status(status).json(result)
            })
    })

    indexRouter.use(authentication(redisClient))

    indexRouter.param("userId", (request, response, next, userId) => {
        userLib.getUser(db, {id: userId})
            .then(user => {
                response.locals.userParam = user
                next()
            })
            .catch(error => {
                const errorCode = error == USER.NOT_FOUND ?
                    httpStatusCodes.NOT_FOUND : httpStatusCodes.INTERNAL_SERVER_ERROR

                response.status(errorCode).json(error.message)
            })
    })

    indexRouter.use(`/:userId(${UUID_REGEX})`, authorization, userRouter({redisClient, db}))

    indexRouter.post("/logout", (request, response) => {
        const {token} = response.locals.user

        userLib.logout(redisClient, token)
            .then(result => {
                response.status(httpStatusCodes.OK).json({result})
            })
            .catch(error => {
                response.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({error})
            })

    })

    return indexRouter
}

module.exports = {
    PATH,
    getRouter
}