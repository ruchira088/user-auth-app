const express = require("express")
const httpStatusCodes = require("http-status-codes")
const userLib = require("../libs/user")
const config = require("../../config.json")
const constants = require("../constants/messages")

const PATH = "/user"
const {collections} = config.services.mongo

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

    return userRouter
}

module.exports = {
    PATH,
    getUserRouter
}