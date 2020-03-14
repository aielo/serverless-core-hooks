"use strict"

const CoreHooks = require("serverless-core-hooks");

class CoreHooksInheritance extends CoreHooks {
  constructor(sls) {
    super(sls);
  }

  configure() {
    super.configure();
    Object.assign(this.hooks, {
      "before:serverless:init": this.hook.bind(this),
      "after:serverless:init": this.hook.bind(this),
      "before:serverless:run": this.hook.bind(this),
      "after:serverless:run": this.hook.bind(this)
    });
    this.config.core.push("serverless");
    this.config.logPrefix = "[CH Inheritance] ";
  }

  hook(event, trigger) {
    trigger += `:${event.target._chName}:${event.key}`;
    this.log("Triggered " + trigger);
  }
}

module.exports = CoreHooksInheritance;
