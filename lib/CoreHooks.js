"use strict"

class CoreHooks {
  constructor(serverless) {
    this.sls = serverless;
    this.pm = serverless.pluginManager;
    if (!this.sls._chEnabled) {
      this.enable();
    }
  }

  // Enables core hooks
  enable() {
    // serverless.run preserved as _chRun
    this.sls._chRun = this.sls.run;
    // serverless.run overridden to force re-init
    this.sls.run = () => {
      this.sls = this.proxy(this.sls);
      this.unloadPlugins();
      this.sls.init().then(() => {
        this.sls.run = this.sls._chRun;
        this.sls.run();
      });
    }
    this.sls._chEnabled = true;
  }

  // Proxies serverless core objects
  proxy(object) {
    object._chOnEvent = (target, key) => {
      // Skips properties and internal methods
      if (key.startsWith("_ch") || (typeof target[key] != "function")) {
        return target[key];
      }
      console.log("> hooking method " + key);
      return target[key];
    }
    object._chIntercept = true;
    return new Proxy(object, {
      get: (target, key) => {
        // return target[key];
        return object._chOnEvent(target, key);
      }
    });
  }

  // Unloads previously loaded plugins (i.e. forces them to reload)
  unloadPlugins() {
    this.pm.plugins = [];
    this.pm.commands = {};
    this.pm.aliases = {};
    this.pm.hooks = {};
  }
}

module.exports = CoreHooks;
