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
    target._chOriginal = target;
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

  // Checks if provided object is a proxy
  isCoreObject: (object) => {
    return "_chOriginal" in object;
  },

  // Extracts original object from provided core object
  extract: (object) => {
    if (CoreObjects.isCoreObject(object)) {
      object = object._chOriginal;
    }
    return object;
  },

  // Turns on interception on provided core objects
  activate: (...objects) => {
    for (const object of objects) {
      if (CoreObjects.isCoreObject(object)) {
        object._chActive = true;
      }
    }
  },

  // Turns off interception on provided core objects
  deactivate: (...objects) => {
    for (const object of objects) {
      if (CoreObjects.isCoreObject(object)) {
        object._chActive = false;
      }
    }
  }
}

module.exports = CoreObjects;
