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
    // Core objects replaced with proxies
    this.coreObjects.push("pluginManager"); // required (i.e. mandatory)
    for (let co of this.coreObjects) {
      this.sls[co] = this.proxy(this.sls[co], "core:" + co.toLowerCase());
    }
    this.sls = this.proxy(this.sls, "core");

    // NOTE: proxyOn/proxyOff calls avoid hooks on method overrides later on

    // Serverless.run: overridden to force re-init
    this.proxyOff();
    this.sls._chRun = this.sls.run; // .run preserved
    this.sls.run = () => {
      this.proxyOn();
      this.sls.init().then(() => {
        this.proxyOff();
        this.sls.run = this.sls._chRun; // .run restored
        this.proxyOn();
        this.sls.run();
      });
    }

    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    this.proxyOff();
    this.pm._chLP = this.pm.loadAllPlugins; // .loadAllPlugins preserved
    this.pm.loadAllPlugins = () => {
      this.pm.plugins = [];
      this.pm.commands = {};
      this.pm.aliases = {};
      this.pm.hooks = {};
      this.pm.loadAllPlugins = this.pm._chLP; // .loadAllPlugins restored
      this.proxyOn();
      this.pm.loadAllPlugins();
    }
    this.sls._ch = this;
  }

  // Proxies serverless core objects
  proxy(object, name) {
    object._chName = name;
    return new Proxy(object, {
      get: (target, key) => {
        // Skips on:
        if (
          !this.shouldIntercept ||         // 1) not flagged
          key.startsWith("_ch") ||         // 2) internals (i.e. _ch*)
          typeof target[key] != "function" // 3) properties
        ) {
          return target[key];
        }
        console.log("> event " + target._chName + ":" + key.toLowerCase());
        return target[key];
      }
    });
  }

  proxyOn() {
    this.shouldIntercept = true;
  }

  proxyOff() {
    this.shouldIntercept = false;
  }
}

module.exports = CoreHooks;
