"use strict"

const _ = require("lodash");

// Default core object (proxy) handler
const CHObjectHandler = {
  get(target, key) {
    const event = this.handleCHEvent(target, key, "get");
    // Applies any changes to target and key
    [target, key] = event.toArray();
    return target[key];
  },
  handleCHEvent(target, key, operation, value) {
    const event = new CHEvent(target, key, operation, value);
    if (this.isCHEvent(event.target, event.key)) {
      CHObjects.log("object event " + event);
      // Executes core hooks and accumulates changes within event
      CHObjects.CHHooks.execute(event, "before");
      CHObjects.CHHooks.execute(event, "after");
    }
    if (this.isCHInternalEvent(event.target, event.key)) {
      CHObjects.log("internal event " + event);
      // Executes internal core hooks and accumulates changes within event
      CHObjects.CHHooks.execute(event, "internal");
    }
    return event;
  },
  isCHEvent(target, key) {
    return target._chActive && !this.isCHKey(key);
  },
  isCHInternalEvent(target, key) {
    return target._chInternal && !this.isCHKey(key);
  },
  isCHKey(key) {
    return !key || (typeof key == "symbol") || key.startsWith("_ch");
  },
  ownKeys(target) {
    return _.keys(target).filter(key => !this.isCHKey(key));
  },
  set(target, key, value) {
    let status = true;
    const event = this.handleCHEvent(target, key, "set", value);
    // Applies any changes to target, key, value and status
    [target, key, , value, status] = event.toArray();
    target[key] = value;
    return status;
  }
}

// Core object event
const CHEvent = function (target, key, operation, value) {
  this.target = target;
  this.key = key;
  this.operation = operation;
  this.value = value;
  this.status = true;
  this.toArray = function () {
    return [this.target, this.key, this.operation, this.value, this.status];
  }
  this.toString = function () {
    const operation = this.operation === "get" ? "" : this.operation + ":";
    return this.target._chName + ":" + operation + this.key;
  }
}

// Core objects module
const CHObjects = {
  // CHHooks (must be set by plugin)
  CHHooks: undefined,

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
  create(name, target, internal = false) {
    target._chOriginal = target;
    target._chName = name;
    target._chActive = false;
    target._chInternal = internal;
    return new Proxy(target, CHObjectHandler);
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
    return _.has(object, "_chOriginal");
  },

  // Logs
  log(message) {
    CHObjects.logger.log(message);
  }
}

module.exports = CHObjects;
