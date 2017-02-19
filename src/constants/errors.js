module.exports = {
    USER: {
        NOT_FOUND: new Error("User NOT found")
    },
    AUTHORIZATION: {
        UNAUTHORIZED: new Error("Unauthorized")
    },
    AUTHENTICATION: {
        TOKEN_EXPIRED: new Error("Token has expired"),
        INVALID_TOKEN: new Error("Invalid token")
    }
}