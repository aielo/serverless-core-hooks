"use strict"

const _ = require("lodash");
const util = require("util");

// Default core object (proxy) handler
const CHObjectHandler = {
  get(target, key) {
    if (this.isCHEvent(target, key)) {
      CHObjects.log("object event " + target._chName + ":" + key);
    }
    return target[key];
  },
  isCHEvent(target, key) {
    return target._chActive && !this.isCHInternal(key);
  },
  isCHInternal(key) {
    return !key || (typeof key == "symbol") || key.startsWith("_ch");
  },
  ownKeys(target) {
    return Object.keys(target).filter(key => !this.isCHInternal(key));
  },
  set(target, key, value) {
    if (this.isCHEvent(target, key)) {
      const message = "object event " + target._chName + ":set:" + key;
      CHObjects.log(message + " " + util.inspect(value));
    }
    target[key] = value;
    return true;
  }
}

const CHObjects = {
  // Default logger
  logger: console,

  // Alias to .active(objects, true)
  activate(...objects) {
    return CHObjects.active(objects, true);
  },

  // Turns interception [ON|off] on provided core objects
  active(objects, active = true) {
    _.each(objects, (object) => {
      if (CHObjects.isCoreObject(object)) {
        object._chActive = active;
      }
    });
  },

  // Creates a core object (proxy) for given object
  create(name, target, handler = CHObjectHandler) {
    target._chOriginal = target;
    target._chName = name;
    target._chActive = false;
    return new Proxy(target, handler);
  },

  // Alias to .active(objects, false)
  deactivate(...objects) {
    return CHObjects.active(objects, false);
  },

  // Extracts original object from provided core object
  extract(object) {
    if (CHObjects.isCoreObject(object)) {
      object = object._chOriginal;
    }
    return object;
  },

  // Checks if provided object is a proxy
  isCoreObject(object) {
    return "_chOriginal" in object;
  },

  // Logs
  log(message) {
    CHObjects.logger.log(message);
  }
}

module.exports = CHObjects;
