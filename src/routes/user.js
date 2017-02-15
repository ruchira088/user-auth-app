const express = require("express")
const httpStatusCodes = require("http-status-codes")
const userLib = require("../libs/user")
const {RESPONSES} = require("../constants/messages")
const {UUID_REGEX} = require("../constants/general")
const {authentication} = require("../middleware/security")

const PATH = "/user"

const getUserRouter = ({redisClient, db}) => {
    const userRouter = express.Router()

    userRouter.post("/", ({body}, response) => {
        const {username, password} = body

        userLib.usernameExists(db, username)
            .then(result => {
                if (result === false) {
                    return userLib.createUser(db, {username, password})
                            .then(result => ({result, status: httpStatusCodes.CREATED}))
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

    userRouter.post("/login", ({body}, response) => {

        userLib.login(db, redisClient, body)
            .then(token => {
                if(token != null) {
                    return {
                        result: {
                            username: body.username,
                            token: token
                        },
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

    userRouter.get(`/:id(${UUID_REGEX})`, (request, response) => {
        response.json({foo: "bar"})
    })

    userRouter.use(authentication(redisClient))

    userRouter.post("/logout", (request, response) => {
        const {token} = response.locals.user

        userLib.logout(redisClient, token)
            .then(result => {
                response.status(httpStatusCodes.OK).json({result})
            })
            .catch(error => {
                response.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({error})
            })

    })

    return userRouter
}

module.exports = {
    PATH,
    getUserRouter
}