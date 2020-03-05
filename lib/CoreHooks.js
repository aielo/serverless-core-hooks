"use strict"

const CoreObjects = require("./utils/CoreObjects");

class CoreHooks {
  constructor(serverless) {
    if (!serverless._chPlugin) {
      this.load(serverless);
    }
  }

  load(serverless) {
    const sls = CoreObjects.proxy("serverless", serverless);
    const pm = CoreObjects.proxy("serverless.pluginmanager", serverless.pluginManager);
    // Serverless.run: overridden to force additional cycle (of init and run)
    const run = sls._chObject.run; // .run preserved
    sls._chObject.run = function () {
      sls.init().then(() => {
        sls._chObject.run = run;   // .run restored
        sls.run(...Object.values(arguments));
      });
    }
    // PluginManager.loadAllPlugins: overridden to force reload of plugins
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
