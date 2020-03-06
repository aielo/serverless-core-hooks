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

  // Attaches before and after hooks to an event (e.g. serverless:run)
  attach(target, key, action, value) {
    let event = target._chName + ":";
    event += (action === "get") ? "" : action + ":";
    event += key;
    let message = "hooks attach " + event;
    message += (action === "set") ? " " + util.inspect(value) : "";
    // TODO: attach before and after hooks
    CHHooks.log(message);
    this.find("before:" + event);
  },

  // Finds hooks for provided trigger (e.g. before:serverless:init)
  find(trigger) {
    const hooks = CHHooks.pluginManager.getHooks(trigger) || [];
    CHHooks.log("hooks find " + trigger + " " + util.inspect(hooks));
    return hooks;
  },

  // Logs
  log(message) {
    CHHooks.logger.log(message);
  }
}

module.exports = CHHooks;
