"use strict"

class CoreHooks {
  constructor(serverless) {
    this.sls = serverless;
    this.pm = serverless.pluginManager;
    this.coreObjects = [
      "cli", "service", "utils", "variables", "yamlParser"
    ];
    if (!this.sls._ch) {
      this.enable();
    }
  }

  // Enables core hooks
  enable() {
    this.coreObjects.push("pluginManager"); // required (i.e. mandatory)
    for (let co of this.coreObjects) {
      this.sls[co] = this.proxy(this.sls[co], "core:" + co.toLowerCase());
    }
    this.sls = this.proxy(this.sls, "core");

    // NOTE: _chOff/_chOn calls avoid hooks on method overrides

    // Serverless.run: overridden to force re-init
    this.sls._chRun = this.sls.run; // .run preserved
    this.sls.run = () => {
      this.sls._chOn();
      this.sls.init().then(() => {
        this.sls._chOff();
        this.sls.run = this.sls._chRun; // .run restored
        this.sls._chOn();
        this.sls.run();
      });
    }

    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    this.pm._chLP = this.pm.loadAllPlugins; // .loadAllPlugins preserved
    this.pm.loadAllPlugins = () => {
      this.pm.plugins = [];
      this.pm.commands = {};
      this.pm.aliases = {};
      this.pm.hooks = {};
      this.pm.loadAllPlugins = this.pm._chLP; // .loadAllPlugins restored
      this.pm._chOn();
      this.pm.loadAllPlugins();
    }
    this.sls._ch = this;
  }

  // Proxies serverless core objects
  proxy(object, name) {
    object._chName = name;
    object._chSkip = false;
    object._chOn = () => { object._chSkip = false; }
    object._chOff = () => { object._chSkip = true; }
    object._chOnEvent = (target, key) => {
      // Skips:
      if (
        target._chSkip ||                // 1) when flagged
        key.startsWith("_ch") ||         // 2) internal methods
        typeof target[key] != "function" // 3) properties
      ) {
        return target[key];
      }
      console.log("> event " + target._chName + ":" + key.toLowerCase());
      return target[key];
    }
    return new Proxy(object, {
      get: (target, key) => {
        // return target[key];
        return object._chOnEvent(target, key);
      }
    });
  }
}

module.exports = CoreHooks;
