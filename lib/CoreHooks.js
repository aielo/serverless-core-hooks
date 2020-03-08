"use strict"

const _ = require("lodash");
const CHObjects = require("./utils/CHObjects");
const CHHooks = require("./utils/CHHooks");

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    this.config = _.get(serverless, "service.custom.coreHooks", {});
    this.coreObjects = {};
    this.hooks = {};
    if (!_.isArray(this.config.objects)) {
      // Skips plugin load: nothing configured
      this.log("No core objects to hook ('custom.coreHooks.objects')");
    } else if (_.has(serverless, "_chPlugin")) {
      // Skips plugin load: already loaded (i.e. all set)
    } else {
      this.load(serverless);
    }
  }

  // Activates core objects (i.e. starts hooking)
  activate() {
    CHObjects.activate(..._.values(this.coreObjects));
  }

  // Loads Core Hooks plugin
  load() {
    const self = this;
    let sls = self.serverless;
    let pm = sls.pluginManager;
    // Serverless.run: overridden to force additional cycle (of init and run)
    const run = sls.run;                  // preserved
    sls.run = function () {
      self.activate();
      self.log("core hooks active");
      sls.init().then(() => {
        CHObjects.extract(sls).run = run; // restored
        sls.run(..._.values(arguments));  // might trigger
      });
    }
    self.log("serverless.run ready to kick start new cycle");
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    pm._chLoadAllPlugins = pm.loadAllPlugins; // .loadAllPlugins preserved
    pm.loadAllPlugins = function () {
      // sls and pm set to original objects (i.e. do not trigger)
      const sls = CHObjects.extract(self.serverless);
      const pm = CHObjects.extract(sls.pluginManager);
      pm.plugins = [];
      pm.commands = {};
      pm.aliases = {};
      pm.hooks = {};
      // .loadAllPlugins called under new name to avoid double trigger
      sls.pluginManager._chLoadAllPlugins(..._.values(arguments));
    }
    self.log("pluginManager.loadAllPlugins ready to reload plugins");
    // Utils setup
    CHObjects.CHHooks = CHHooks;
    CHHooks.pluginManager = pm;
    CHHooks.logger = CHObjects.logger = self;
    // Internal core objects (i.e. plugin has its own hooks on them)
    const internals = ["serverless", "pluginManager"];
    // Objects replaced with core objects (i.e. their proxies)
    const objects = _.uniq(_.concat(internals, this.config.objects));
    _.each(objects, (name) => {
      const internal = _.includes(internals, name);
      if (name === "serverless") {  // serverless itself
        sls = CHObjects.create(name, sls, internal);
        self.coreObjects[name] = sls;
      } else {                      // serverless child
        sls[name] = CHObjects.create(name, sls[name], internal);
        sls[name].serverless = sls; // circular references
        if (_.includes(this.config.objects, name)) {
          // Only configured core objects are added for activation
          self.coreObjects[name] = sls[name];
        }
      }
    });
    // Core objects reassignment hooks
    _.each(_.keys(this.coreObjects), (name) => {
      if (name !== "serverless") {
        const key = "internal:serverless:set:" + name;
        this.hooks[key] = this.onCoreObjectAssignment.bind(this)
      }
    });
    // Plugin tied to serverless to indicate it has been loaded
    sls._chPlugin = self;
  }

  // Logs (with support to both Serverless and Core Hooks only flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      message = "[CH] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      // Core object triggers prevented on plugin logs
      const cli = CHObjects.extract(this.serverless.cli);
      cli.log(message);
    }
  }

  // Ensures core hook objects live thru reassignment (i.e. keep proxied)
  onCoreObjectAssignment(event) {
    const object = event.target[event.key];
    if (CHObjects.isCoreObject(object)) {
      event.value = CHObjects.create(event.key, event.value);
      CHObjects.activate(event.value);
    }
  }
}

module.exports = CoreHooks;
