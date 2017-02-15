const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")
const http = require("http")

const packageJson = require("../package.json")
const config = require("../config.json")
const redis = require("./libs/redis")
const mongo = require("./libs/mongo")
const user = require("./routes/user")

const PORT = process.env.HTTP_PORT || config.httpPort

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get("/info", (request, response) => {
	const {name, version, description} = packageJson

	response.send({name, description, version});
})

Promise.all([redis.connect(), mongo.connect()])
    .then(([redisClient, db]) => {

        app.use(user.PATH, user.getUserRouter({redisClient, db}))

        http.createServer(app).listen(PORT, () =>
        {
            console.log(`Server is listening on port: ${PORT}`)
        })
    })
    .catch(error => {
        console.error(error)
        process.exit(1)
    })