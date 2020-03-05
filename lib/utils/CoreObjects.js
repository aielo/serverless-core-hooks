"use strict"

const CoreObjects = {

  // Default proxy handler
  proxyHandler: {
    get: (target, key) => {
      if (!target._chInternal(key) && target._chActive) {
        console.log("get " + target._chName + "." + key);
      }
      return target[key];
    },
    set: (target, key, value) => {
      if (!target._chInternal(key) && target._chActive) {
        console.log("set " + target._chName + "." + key + " to " + value);
      }
      target[key] = value;
      return true;
    },
    ownKeys: (target) => {
      return Object.keys(target).filter(key => !target._chInternal(key));
    }
  },

  // Creates a core object (proxy) for given object
  create: (name, target, handler = CoreObjects.proxyHandler) => {
    target._chObject = target;
    target._chName = name;
    target._chActive = false;
    target._chInternal = (key) => {
      if (!key || typeof key == "symbol") {
        return true;
      }
      return key.startsWith("_ch");
    };
    return new Proxy(target, handler);
  },

  // Turns on interception on provided core objects
  turnOn: (objects = []) => {
    for (const object of objects) {
      object._chActive = true;
    }
  },

  // Turns off interception on provided core objects
  turnOff: (objects = []) => {
    for (const object of objects) {
      object._chActive = false;
    }
  }
}

module.exports = CoreObjects;
