"use strict"

const _ = require("lodash");
const CoreObjects = require("./utils/CoreObjects");

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    if (!_.has(serverless, "_chPlugin")) {
      this.load(serverless);
    }
  }

  load() {
    // Core objects replaced with proxies
    const sls = CoreObjects.proxy("core", this.serverless);
    const coreObjects = _.get(sls, "service.custom.coreHooks.objects", []);
    coreObjects.push("cli", "pluginManager"); // mandatory core objects
    for (let object of _.uniq(coreObjects)) {
      sls[object] = CoreObjects.proxy(  // proxy:
        "core:" + object.toLowerCase(), // - name
        sls[object]                     // - original object
      );
      if (_.has(sls, "serverless")) {
        sls[object].serverless = sls; // circular ref updated to proxy
      }
    }
    let message = "core objects available: ";
    message += JSON.stringify(_.concat(["serverless"], coreObjects));
    this.log(message);
    // Serverless.run: overridden to force additional cycle (of init and run)
    const run = sls._chObject.run; // .run preserved
    sls._chObject.run = function () {
      sls.init().then(() => {
        sls._chObject.run = run;   // .run restored
        sls.run(...Object.values(arguments));
      });
    }
    this.log("serverless.run ready to kick start new cycle");
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
    this.log("pluginManager.loadAllPlugins ready to reload plugins");
    // Plugin tied to serverless to indicate it has been loaded
    sls._chObject._chPlugin = this;
  }

  // Logs (with support to both Serverless and specific CoreHooks flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      message = "[CH] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      let cli;
      // Proxy triggers prevented when possible
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
