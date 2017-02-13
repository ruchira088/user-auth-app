const express = require("express")
const httpStatusCodes = require("http-status-codes")
const userLib = require("../libs/user")
const constants = require("../constants/messages")
const config = require("../../config.json")
const {AUTHENTICATION} = require("../constants/errors")

const PATH = "/user"

const authenticationMiddleware = redis => (request, response, next) => {
    const token = request.get(config.security.authenticationHeader)

    userLib.getUserFromToken(redis, token)
        .then(user => {
            response.locals.user = user
            next()
        })
        .catch(error => {
            const authError = Object.keys(AUTHENTICATION)
                .map(key => AUTHENTICATION[key])
                .find(authenticationError => authenticationError == error)

            const statusCode = (() => {
                if(authError == undefined) {
                    return httpStatusCodes.INTERNAL_SERVER_ERROR
                } else {
                    return httpStatusCodes.UNAUTHORIZED
                }
            })()

            response.status(statusCode).json(error)
        })
}

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
                        result: `${constants.RESPONSES.USERNAME_EXISTS}: ${username}`,
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
                        result: constants.RESPONSES.INVALID_CREDENTIALS,
                        status: httpStatusCodes.UNAUTHORIZED
                    }
                }
            })
            .catch(error => ({result: error, status: httpStatusCodes.INTERNAL_SERVER_ERROR}))
            .then(({status, result}) => {
                response.status(status).json(result)
            })
    })

    userRouter.use(authenticationMiddleware(redisClient))

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