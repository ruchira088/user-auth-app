const bcrypt = require("bcrypt")
const generalLib = require("./general")
const config = require("../../config.json")

const {collections} = config.services.mongo

const getUser = (db, username) => (
    db.collection(collections.users).findOne({username})
)

const usernameExists = (db, username) => (
    getUser(db, username).then(result => result != null)
)

const createUser = (db, user) => (
    bcrypt.hash(user.password, config.security.saltRounds)
        .then(hash =>
            db.collection(collections.users)
                .insertOne(Object.assign({}, user, {password: hash}))
        )
)

const login = (db, redisClient, {username, password}) => (
    getUser(db, username)
        .then(user => bcrypt.compare(password, user.password))
        .then(success => {
            if(success) {
                const token = generalLib.getRandomString()
                return redisClient.addUserToken(username, token)
                        .then(() => token)
            } else {
                return null
            }
        })
)

module.exports = {
    createUser,
    usernameExists,
    login
}