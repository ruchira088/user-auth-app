const {PRIVATE_FIELDS} = require("../constants/database")

const callback = (resolve, reject) => (error, value) => {
    if(error != null) {
        resolve(error)
    } else {
        resolve(value)
    }
}

const delay = (promise, delay) => (
    new Promise((resolve, reject) => {
        setTimeout(() => {
            promise().then(resolve).catch(reject)
        }, delay)
    })
)

const getRandomString = (length = 32) => {
    const random = Math.random().toString(36).slice(2)

    if (length <= random.length) {
        return random.substring(0, length)
    } else {
        return random + getRandomString(length - random.length)
    }
}

const filterObject = condition => object =>
    Object.keys(object)
        .filter(condition(object))
        .reduce((output, key) => Object.assign({}, output, {[key]: object[key]}), {})


const sanitize = filterObject(() => key => !PRIVATE_FIELDS.includes(key))

const getNonNullValues = filterObject(object => key => object[key] != null)

module.exports = {
    callback,
    delay,
    getRandomString,
    sanitize,
    getNonNullValues
}