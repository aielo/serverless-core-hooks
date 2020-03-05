"use strict"

const _ = require("lodash");
const CoreObjects = require("./utils/CoreObjects");

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    this.config = _.get(serverless, "service.custom.coreHooks", {});
    this.coreObjects = {};
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
    CoreObjects.activate(..._.values(this.coreObjects));
  }

  // Loads Core Hooks plugin
  load() {
    const self = this;
    // Serverless.run: overridden to force additional cycle (of init and run)
    let sls = self.serverless;
    const run = sls.run; // .run preserved
    sls.run = function () {
      self.activate();
      self.log("core hooks active");
      sls.init().then(() => {
        sls.run = run;   // .run restored
        sls.run(..._.values(arguments));
      });
    }
    self.log("serverless.run ready to kick start new cycle");
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    const pm = sls.pluginManager;
    const loadAP = pm.loadAllPlugins; // .loadAllPlugins preserved
    pm.loadAllPlugins = function () {
      pm.plugins = [];
      pm.commands = {};
      pm.aliases = {};
      pm.hooks = {};
      pm.loadAllPlugins = loadAP;     // .loadAllPlugins restored
      // THIS GUY NEEDS TO BE A PROXY
      pm.loadAllPlugins(..._.values(arguments));
    }
    self.log("pluginManager.loadAllPlugins ready to reload plugins");
    // Objects replaced with core objects (i.e. their proxies)
    const objects = this.config.objects;
    _.each(objects, (name) => {
      if (name === "serverless") {  // serverless itself
        sls = CoreObjects.create(name, sls);
        self.coreObjects[name] = sls;
      } else {                      // serverless child
        sls[name] = CoreObjects.create(name, sls[name]);
        sls[name].serverless = sls; // circular references
        self.coreObjects[name] = sls[name];
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
      const cli = CoreObjects.extract(this.serverless.cli);
      cli.log(message);
    }
  }
}

module.exports = CoreHooks;
