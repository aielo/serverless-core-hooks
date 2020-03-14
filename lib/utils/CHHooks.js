"use strict"

const _ = require("lodash");
const util = require("util");

const CHHooks = {
  // Default logger
  logger: console,

  // Plugin Manager instance (must be set by plugin)
  pluginManager: {
    getHooks: () => { } // mock to prevent (undefined) errors
  },

  // Executes hooks for provided event and trigger (e.g. cli:log and before)
  execute(event, trigger) {
    const key = trigger + ":" + event;
    const hooks = this.find(event, trigger);
    _.each(hooks, (hook) => {
      CHHooks.log("hooks exec " + key + " " + util.inspect(hook));
      // Event holds changes to core objects
      hook.hook(event, trigger);
    });
  },

  // Finds hooks for provided event and trigger (e.g. serverless:init and after)
  find(event, trigger) {
    const key = trigger + ":" + event;
    const hooks = CHHooks.pluginManager.getHooks(key) || [];
    CHHooks.log("hooks find " + key + " " + util.inspect(hooks));
    return hooks;
  },

  // Logs
  log(message) {
    CHHooks.logger.log(message, true);
  }
}

module.exports = CHHooks;
