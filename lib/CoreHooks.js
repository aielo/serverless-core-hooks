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
    const self = this;
    if (
      self.sls.service.custom &&
      self.sls.service.custom.coreHooks &&
      self.sls.service.custom.coreHooks.objects
    ) {
      // Custom core objects from config
      this.co = self.sls.service.custom.coreHooks.objects;
    }
    // Core objects: replaced with (turned off) proxies
    self.proxyOff();
    self.sls = self.proxy(self.sls, "core"); // mandatory
    self.co.push("pluginManager");           // mandatory
    for (let o of self.co) {
      self.sls[o] = self.proxy(self.sls[o], "core:" + o.toLowerCase());
    }
    // Serverless.run: overridden to force re-init (and then run normally)
    self.sls._chRun = self.sls.run; // .run preserved
    self.sls.run = function () {
      self.proxyOn(); // Core Hooks enabled for other plugins
      self.sls.init().then(() => {
        self.proxyIgnore(() => {
          self.sls.run = self.sls._chRun; // .run restored
        })();
        self.sls.run(...Object.values(arguments));
      });
    }
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    self.pm._chLP = self.pm.loadAllPlugins; // .loadAllPlugins preserved
    self.pm.loadAllPlugins = function () {
      self.pm.plugins = [];
      self.pm.commands = {};
      self.pm.aliases = {};
      self.pm.hooks = {};
      self.proxyIgnore(() => {
        self.pm.loadAllPlugins = self.pm._chLP; // .loadAllPlugins restored
      })();
      self.pm.loadAllPlugins(...Object.values(arguments));
    }
    self.sls._ch = self;
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
          return this.attachHooks(target, key);
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

  // Prevents function from being intercepted by proxy
  proxyIgnore(executable) {
    const self = this;
    return function () {
      self.proxyOff();
      const result = executable(...Object.values(arguments));
      self.proxyOn();
      return result;
    };
  }

  // Attaches before and after hooks to an event (e.g. core:cli:processInput)
  attachHooks(object, event) {
    const self = this;
    return function () {
      const suffix = (":" + object._chName + ":" + event).toLowerCase();
      const args = [...Object.values(arguments)];
      self.executeHooks("before" + suffix, ...args);
      let result = object[event](...args);
      self.executeHooks("after" + suffix, ...args);
      return result;
    }
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

  // Executes all hooks for provided trigger (e.g. after:core:run)
  executeHooks(trigger, args) {
    const hooks = this.findHooks(trigger);
    for (const hook of hooks) {
      this.log("hook exec " + trigger + " [" + hook + "]");
      hook.hook(args);
    }
  }

  // Logs (with support to both Serverless and specific CoreHooks flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      this.proxyIgnore(() => {
        this.sls.cli.log(("[CH] " + message).replace(/[\r|\n|\t]/g, ""));
      })();
    }
  }
}

module.exports = CoreHooks;
