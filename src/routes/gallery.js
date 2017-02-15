const express = require("express")

const PATH = "/gallery"

const getGalleryRouter = (redisClient, db) => {
    const galleryRouter = express.Router()

    galleryRouter.post("/", (request, response) => {

    })

    return galleryRouter
}

module.exports = {
    getGalleryRouter,
    PATH
}