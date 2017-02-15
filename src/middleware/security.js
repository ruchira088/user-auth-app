const httpStatusCodes = require("http-status-codes")
const userLib = require("../libs/user")
const config = require("../../config.json")
const {AUTHENTICATION} = require("../constants/errors")

const authentication = redis => (request, response, next) => {
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

module.exports = {
    authentication
}