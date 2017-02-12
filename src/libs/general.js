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

const getRandomString = (strength = 2) => {
    if(strength == 0) {
        return ""
    } else {
        return Math.random().toString(36).slice(2) + getRandomString(strength-1)
    }
}

module.exports = {
    callback,
    delay,
    getRandomString
}