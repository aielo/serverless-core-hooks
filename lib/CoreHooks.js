"use strict"

const _ = require("lodash");
const CoreObjects = require("./utils/CoreObjects");

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    this.config = _.get(serverless, "service.custom.coreHooks", {});
    if (!_.isArray(this.config.objects)) {
      // Skips plugin load: nothing configured
      this.log("No core objects to hook ('custom.coreHooks.objects')");
    } else if (_.has(serverless, "_chPlugin")) {
      // Skips plugin load: already loaded (i.e. all set)
    } else {
      this.load(serverless);
    }
  }

  // Loads Core Hooks plugin
  load() {
    // Objects replaced with core objects (i.e. proxies)
    const self = this;
    const sls = CoreObjects.create("serverless", self.serverless);
    const objects = _.union(self.objects, ["cli", "pluginManager"]);
    for (let object of objects) {
      sls[object] = CoreObjects.create(object, sls[object]);
      if (_.has(sls, "serverless")) {
        sls[object].serverless = sls; // circular ref to core object
      }
    }
    self.log("core objects available: " + JSON.stringify(self.objects));
    // Serverless.run: overridden to force additional cycle (of init and run)
    const run = sls._chObject.run; // .run preserved
    sls._chObject.run = function () {
      sls.init().then(() => {
        sls._chObject.run = run;   // .run restored
        sls.run(...Object.values(arguments));
      });
    }
    self.log("serverless.run ready to kick start new cycle");
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
    const pm = sls.pluginManager;
    const loadAP = pm._chObject.loadAllPlugins; // .loadAllPlugins preserved
    pm._chObject.loadAllPlugins = function () {
      pm.plugins = [];
      pm.commands = {};
      pm.aliases = {};
      pm.hooks = {};
      pm._chObject.loadAllPlugins = loadAP;     // .loadAllPlugins restored
      pm.loadAllPlugins(...Object.values(arguments));
    }
    self.log("pluginManager.loadAllPlugins ready to reload plugins");
    // Plugin tied to serverless to indicate it has been loaded
    sls._chObject._chPlugin = self;
  }

  // Logs (with support to both Serverless and Core Hooks only flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      message = "[CH] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      let cli;
      // Core object triggers prevented when possible
      if (_.has(this.serverless, "_chObject.cli._chObject")) {
        cli = this.serverless._chObject.cli._chObject;
      } else {
        cli = this.serverless.cli;
      }
      cli.log(message);
    }
  }
}

module.exports = CoreHooks;
