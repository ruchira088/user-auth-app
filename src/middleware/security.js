const httpStatusCodes = require("http-status-codes")
const userLib = require("../libs/user")
const config = require("../../config.json")
const {AUTHENTICATION, AUTHORIZATION} = require("../constants/errors")

const authentication = redis => (request, response, next) => {
    const token = request.get(config.security.authenticationHeader)

    userLib.getUserFromToken(redis, token)
        .then(user => {
            response.locals.user = user
            next()
        })
        .catch(error => {
            const authErrors = Object.keys(AUTHENTICATION).map(key => AUTHENTICATION[key])

            const statusCode = (() => {
                if(authErrors.includes(error)) {
                    return httpStatusCodes.UNAUTHORIZED
                } else {
                    return httpStatusCodes.INTERNAL_SERVER_ERROR
                }
            })()

            response.status(statusCode).json(error)
        })
}

const isAuthorized = (user, accessObject) => (
    user.id != null && user.id === accessObject.id
)

const authorization = (request, response, next) => {
    const {user, userParam} = response.locals

    if(isAuthorized(user, userParam)) {
        next()
    } else {
        response.status(httpStatusCodes.UNAUTHORIZED)
            .json(AUTHORIZATION.UNAUTHORIZED.message)
    }
}

module.exports = {
    authentication,
    authorization
}