"use strict"

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    if (!this.serverless.hasCoreHooks) {
      this.proxy();
    }
  }

  proxy() {
    // Prevents current execution (preserves method run as _run)
    this.serverless._run = this.serverless.run;
    this.serverless.run = () => {};

    // Proxies serverless object
    this.serverless = new Proxy(this.serverless, {
      get: function(target, name) {
        console.log(`intercepted ${name}`);
        return target[name];
      }
    });

    // TODO: Adds hooks
    this.serverless.hasCoreHooks = true;

    // Re-initializes serverless and finally runs
    this.serverless.init().then(() => this.serverless._run());
  }
}

module.exports = CoreHooks;
