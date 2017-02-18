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

module.exports = {
    authentication
}