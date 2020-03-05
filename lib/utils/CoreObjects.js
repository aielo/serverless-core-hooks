"use strict"

class CoreObjects {
  constructor(plugin) {
    this.plugin = plugin;
  }

  handler() {
    return {
      get: (target, key) => {
        if (!target._chInternal(key)) {
          console.log("get " + target._chName + "." + key);
        }
        return target[key];
      },
      set: (target, key, value) => {
        if (!target._chInternal(key)) {
          console.log("set " + target._chName + "." + key + " to " + value);
        }
        target[key] = value;
        return true;
      },
      ownKeys: (target) => {
        return Object.keys(target).filter(key => !target._chInternal(key));
      }
    }
  }

  proxy(name, target, handler = this.handler()) {
    target._chObject = target;
    target._chName = name;
    target._chInternal = (key) => {
      if (!key || typeof key == "symbol") {
        return true;
      }
      return key.startsWith("_ch");
    };
    return new Proxy(target, handler);
  }
}

module.exports = new CoreObjects();
