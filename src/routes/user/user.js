const express = require("express")
const {sanitize} = require("../../libs/general")

const getUserRouter = ({redisClient, db}) => {
    const userRouter = express.Router()

    userRouter.get("/", (request, response) => {
        const {userParam} = response.locals

        response.json(sanitize(userParam))
    })

    return userRouter
}

module.exports = getUserRouter