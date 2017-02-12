const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")

const http = require("http")
const path = require("path")

const packageJson = require("../package.json")
const redis = require("./libs/redis")
const mongo = require("./libs/mongo")
const user = require("./routes/user")

const PORT = process.env.HTTP_PORT || 8000

const app = express()

app.set("view engine", "hbs")
app.set("views", path.join(__dirname, "views"))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(process.cwd(), "public")))

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