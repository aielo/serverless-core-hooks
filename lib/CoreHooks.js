"use strict"

const _ = require("lodash");
const CoreObjects = require("./utils/CoreObjects");

class CoreHooks {
  constructor(serverless) {
    if (!_.has(serverless, "_chPlugin")) {
      this.load(serverless);
    }
  }

  load(serverless) {
    // Core objects replaced with proxies
    const sls = CoreObjects.proxy("core", serverless);
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
    // Serverless.run: overridden to force additional cycle (of init and run)
    const run = sls._chObject.run; // .run preserved
    sls._chObject.run = function () {
      sls.init().then(() => {
        sls._chObject.run = run;   // .run restored
        sls.run(...Object.values(arguments));
      });
    }
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
    // Plugin tied to serverless to indicate it has been loaded
    sls._chObject._chPlugin = this;
  }
}

module.exports = CoreHooks;
