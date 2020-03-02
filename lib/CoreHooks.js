"use strict"

class CoreHooks {
  constructor(serverless) {
    this.sls = serverless;
    this.pm = serverless.pluginManager;
    this.co = ["cli", "service", "utils", "variables", "yamlParser"];
    if (!this.sls._ch) {
      this.load();
    }
  }

  // Enables core hooks on serverless and its core objects
  // NOTE: proxies are turned on just (and only) before serverless.init
  // NOTE: proxyIgnore prevents proxy trigger during method overrides
  load() {
    // Core objects replaced with (turned off) proxies
    this.proxyOff();
    this.sls = this.proxy(this.sls, "core");
    this.co.push("pluginManager"); // pluginManager required (i.e. mandatory)
    for (let o of this.co) {
      this.sls[o] = this.proxy(this.sls[o], "core:" + o.toLowerCase());
    }
    // Serverless.run: overridden to force re-init (and then run normally)
    this.sls._chRun = this.sls.run; // .run preserved
    this.sls.run = () => {
      this.proxyOn(); // Core Hooks enabled for other plugins
      this.sls.init().then(() => {
        this.proxyIgnore(() => {
          this.sls.run = this.sls._chRun; // .run restored
        });
        this.sls.run();
      });
    };
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    this.pm._chLP = this.pm.loadAllPlugins; // .loadAllPlugins preserved
    this.pm.loadAllPlugins = () => {
      this.pm.plugins = [];
      this.pm.commands = {};
      this.pm.aliases = {};
      this.pm.hooks = {};
      this.proxyIgnore(() => {
        this.pm.loadAllPlugins = this.pm._chLP; // .loadAllPlugins restored
      });
      this.pm.loadAllPlugins();
    }
    this.sls._ch = this;
  }

  // Proxies serverless core objects
  proxy(object, name) {
    object._chName = name;
    return new Proxy(object, {
      get: (target, key) => {
        // Intercepts:
        if (
          this.proxyActive &&                 // when proxies are active
          typeof target[key] == "function" && // only methods
          !key.startsWith("_ch")              // and not internals (i.e. _ch*)
        ) {
          this.log("get " + target._chName + ":" + key.toLowerCase());
          target[key] = this.attachHooks(target, key);
        }
        return target[key];
      },
      set: (target, key, value) => {
        // Intercepts re-assignments:
        if (
          this.proxyActive &&           // when proxies are active
          target._chName === "core" &&  // on core (i.e. serverless only)
          this.co.indexOf(key) != -1 && // of core objects only
          typeof value === "object" &&  // when new value is an object
          value !== null                // and not null (cannot be proxied)
        ) {
          this.log("set core:" + key + " = " + value);
          target[key] = this.proxy(value, "core:" + key.toLowerCase());
        } else {
          target[key] = value;
        }
        return true;
      }
    });
  }

  // Turns on interception on all proxies
  proxyOn() {
    this.proxyActive = true;
  }

  // Turns off interception on all proxies
  proxyOff() {
    this.proxyActive = false;
  }

  // Executes provided function without proxy intercepts
  proxyIgnore(executable) {
    this.proxyOff();
    executable();
    this.proxyOn();
  }

  // Attaches before and after hooks to an event (e.g. core:cli:processInput)
  attachHooks(object, event) {
    const suffix = String(":" + object._chName + ":" + event).toLowerCase();
    const before = this.findHooks("before" + suffix);
    const after = this.findHooks("after" + suffix);
    return object[event];
  }

  // Finds all hooks for provided trigger (e.g. before:core:init)
  findHooks(trigger) {
    const hooks = this.pm.getHooks(trigger) || [];
    if (hooks.length > 0) {
      this.log("hooks " + trigger + " [" + hooks + "]");
      this.log(hooks);
    }
    return hooks;
  }

  // Logs (with support to both Serverless and specific CoreHooks flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      this.proxyIgnore(() => {
        this.sls.cli.log("[CH] " + String(message).replace(/[\r|\n|\t]/g, ""));
      });
    }
  }
}

module.exports = CoreHooks;
