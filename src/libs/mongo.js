const {MongoClient} = require("mongodb")
const {delay} = require("./general")
const config = require("../../config.json")

const mongoConfig = config.services.mongo

const connectToMongo = url => MongoClient.connect(url).then(db => {
    console.log(`Successfully connected to MongoDB`)

    return db
})

const connect = (remainingAttempts = 2) => {
    const mongoUrl = `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}`

    console.log(`Connecting to MongoDB on ${mongoUrl}`)

    return connectToMongo(mongoUrl).catch(error => {

        if(remainingAttempts > 0) {
            console.warn(`Unable to connect to MongoDB: ${error}`)
            console.warn(`Remaining attempts: ${remainingAttempts}`)

            return delay(() => connect(remainingAttempts-1), config.serviceRecheckInterval)
        } else {
            console.error(`Failed to connect to MongoDB: ${error}`)

            return Promise.reject(error)
        }
    })
}

module.exports = {
    connect
}
