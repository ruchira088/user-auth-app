const express = require("express")
const {sanitize} = require("../../libs/general")

const getUserRouter = ({redisClient, db}) => {
    const userRouter = express.Router()

    userRouter.route("/")
        .get((request, response) => {
            const {userParam} = response.locals

            response.json(sanitize(userParam))
        })
        .patch((request, response) => {

        })

    return userRouter
}

module.exports = getUserRouter