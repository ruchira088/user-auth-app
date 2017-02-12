const redis = require("redis")
const config = require("../../config.json")
const {callback, delay} = require("./general")

const {host: redisHost} = config.services.redis

const connectToRedis = host => (
    new Promise((resolve, reject) => {
        const redisClient = redis.createClient({host})

        console.log(`Connecting to Redis on ${host}`)

        redisClient.on("error", error => {
            console.warn(`Unable to connect to Redis: ${error}`)
            reject(error)
            redisClient.quit()
        })

        redisClient.on("connect", () => {
            console.log("Successfully connected to Redis")

            const set = (key, value) => (
                new Promise((resolve, reject) => {
                    redisClient.set(key, JSON.stringify(value), callback(resolve, reject))
                })
            )

            const get = key => (
                new Promise((resolve, reject) => {
                    redisClient.get(key, callback(resolve, reject))
                }).then(JSON.parse)
            )

            const addUserToken = (user, token) => (
                get(user)
                    .then(userTokens => {
                        if (userTokens != null) {
                            return userTokens.concat(token)
                        } else {
                            return [token]
                        }
                    })
                    .then(userTokens => set(user, userTokens))
            )

            resolve({addUserToken})
        })
    })
)

const connect = (remainingAttempts = 2) => connectToRedis(redisHost).catch(error => {
    if(remainingAttempts > 0) {

        console.warn(`Will attempt to reconnect to Redis is ${config.serviceRecheckInterval/1000}s`)
        console.warn(`Remaining attempts: ${remainingAttempts}`)

        return delay(() => connect(remainingAttempts-1), config.serviceRecheckInterval)

    } else {
        console.error("Failed to connect to Redis")
        return Promise.reject(error)
    }
})

module.exports = {
    connect
}