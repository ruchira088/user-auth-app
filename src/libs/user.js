const bcrypt = require("bcrypt")
const moment = require("moment")
const uuid = require("uuid")
const generalLib = require("./general")
const config = require("../../config.json")
const {AUTHENTICATION, USER} = require("../constants/errors")

const {collections} = config.services.mongo

const getUser = (db, query) => (
    db.collection(collections.users).findOne(query)
        .then(user => user == null ? Promise.reject(USER.NOT_FOUND) : user)
)

const usernameExists = (db, username) => (
    getUser(db, {username})
        .then(() => true)
        .catch(error => error === USER.NOT_FOUND ? false : Promise.reject(error))
)

const createUser = (db, user) => (
    bcrypt.hash(user.password, config.security.saltRounds)
        .then(hash => {
            const userEntry = Object.assign({}, user, {
                id: uuid.v4(),
                password: hash
            })

            return db.collection(collections.users).insertOne(userEntry)
                    .then(() => userEntry)
        })
)

const login = (db, redisClient, {username, password}) => (
    getUser(db, {username})
        .then(user => {
            if(user != null) {
                return bcrypt.compare(password, user.password)
                    .then(success => {
                        if(success) {
                            const {unit, length} = config.security.sessionTimeout
                            const token = generalLib.getRandomString()
                            const sessionExpire = moment().add(length, unit).toISOString()

                            return redisClient.set(token, {user, sessionExpire, token})
                                .then(() => ({
                                    token, username,
                                    userId: user.id
                                }))
                        } else {
                            return null
                        }
                    })
            } else {
                return null
            }
        })
)

const getUserFromToken = (redisClient, token) => (
    redisClient.get(token).then(result => {
        if(result != null) {
            const {user, sessionExpire} = result

            if(moment().isBefore(moment(sessionExpire))) {
                const {unit, length} = config.security.sessionTimeout

                return redisClient.set(token,
                    Object.assign({}, result,
                        {sessionExpire: moment().add(length, unit).toISOString()})
                    )
                    .then(() => Object.assign({}, user, {token}))
            } else {
                return redisClient.remove(token)
                    .then(() =>
                        Promise.reject(AUTHENTICATION.TOKEN_EXPIRED)
                    )
            }

        } else {
            return Promise.reject(AUTHENTICATION.INVALID_TOKEN)
        }
    })
)

const logout = (redis, token) => redis.remove(token)

module.exports = {
    getUser,
    createUser,
    usernameExists,
    getUserFromToken,
    login,
    logout
}