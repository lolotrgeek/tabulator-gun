const Gun = require('gun')
// const gun = new Gun(['http://localhost:8765/gun'])
const gun = new Gun([])

/**
 * resolves to values of given key 
 * @param {string} key 
 */
const get = key => new Promise((resolve, reject) => {
  gun.get(key, ack => {
    console.log('GUN GET : ', key, ack.put)
    if (ack.err) { reject(ack.err) }
    else if (!ack.put) { reject(ack.err) }
    else { resolve(ack.put) }
  })
});


/**
 * 
 * @param {string} key 
 * @param {object} value 
 * @param {string} parent 
 */
const set = (key, value, parent) => new Promise((resolve, reject) => {
  console.log('GUN SET : ', key, value, parent)
  let node = gun.get(key)
  node.put(value)
  if (parent) {
    let list = gun.get(parent)
    list.set(node)
    resolve(true)
  } else {
    resolve(true)
  }

});


/**
 * 
 * @param {string} key 
 * @param {string} parent 
 */
const remove = (key, parent) => new Promise((resolve, reject) => {
  if (!key) key = Date.now().toString() + Math.random().toString()
  console.log('GUN REMOVE : ', key, parent)
  let node = gun.get(key)
  if (parent) {
    let list = gun.get(parent)
    list.unset(node)
    node.put(null)
    resolve(true)
  }
  else {
    node.put(null)
    resolve(true)
  }
});

module.exports = {
  set: set,
  get: get,
  remove, remove
}