"use strict"

const CoreHooks = require("serverless-core-hooks");

class CoreHooksInheritance extends CoreHooks {
  constructor(sls) {
    super(sls);
  }

  configure() {
    Object.assign(this.hooks, {
      "before:serverless:init": this.hook.bind(this),
      "after:serverless:init": this.hook.bind(this),
      "before:serverless:run": this.hook.bind(this),
      "after:serverless:run": this.hook.bind(this)
    });
    this.config.core.push("serverless");
  }

  hook(event, trigger) {
    trigger += `:${event.target._chName}:${event.key}`;
    this.sls.cli.log("[CH Inheritance] Triggered: " + trigger);
  }
}

module.exports = CoreHooksInheritance;
