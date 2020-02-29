"use strict"

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    if (!this.serverless.hasCoreHooks) {
      this.proxy();
    }
  }

  proxy() {
    // Proxies serverless object
    this.serverless = new Proxy(this.serverless, {
      get: (target, name) => {
        console.log(`intercepted ${name}`);
        return target[name];
      }
    });

    // TODO: Adds hooks
    this.serverless.hasCoreHooks = true;

    // Re-initializes serverless and runs
    this.serverless._run = this.serverless.run;
    this.serverless.run = () => {
      this.cleanup();
      this.serverless.init().then(() => this.serverless._run());
    };
  }

  cleanup() {
    this.serverless.pluginManager.plugins = [];
    this.serverless.pluginManager.commands = {};
    this.serverless.pluginManager.aliases = {};
    this.serverless.pluginManager.hooks = {};
  }
}

module.exports = CoreHooks;
