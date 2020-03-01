"use strict"

class CoreHooks {
  constructor(serverless) {
    this.sls = serverless;
    this.pm = serverless.pluginManager;
    this.co = ["cli", "service", "utils", "variables", "yamlParser"];
    if (!this.sls._ch) {
      this.enable();
    }
  }

  // Enables core hooks
  enable() {
    // Core objects replaced with proxies
    this.co.push("pluginManager"); // required (i.e. mandatory)
    for (let o of this.co) {
      this.sls[o] = this.proxy(this.sls[o], "core:" + o.toLowerCase());
    }
    this.sls = this.proxy(this.sls, "core");

    // NOTE: proxy[On/Off] calls avoid hooks on method overrides later on

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
          !this.shouldIntercept ||         // 1) not intercept-flagged
          key.startsWith("_ch") ||         // 2) internals (i.e. _ch*)
          typeof target[key] != "function" // 3) properties
        ) {
          return target[key];
        }
        console.log(`> get ${target._chName}:${key.toLowerCase()}`);
        // return this.hooks();
        return target[key];
      },
      set: (target, key, value) => {
        // Intercepts re-assignments:
        if (
          this.shouldIntercept &&       // intercept-flagged
          target._chName === "core" &&  // on core (i.e. serverless only)
          this.co.indexOf(key) != -1 && // of core objects only
          typeof value === "object" &&  // when new value is an object
          value !== null                // and not null (cannot be proxied)
        ) {
          console.log(`> set core:${key} = ${String(value).substr(0, 10)}...`);
          target[key] = this.proxy(value, "core:" + key.toLowerCase());
        } else {
          target[key] = value;
        }
        return true;
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
