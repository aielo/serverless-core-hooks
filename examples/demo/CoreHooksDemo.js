"use strict"

const util = require("util");

class CoreHooksDemo {
  constructor(serverless) {
    this.sls = serverless;
    this.commands = {
      demo: {
        usage: "Core Hooks plugin demonstration",
        lifecycleEvents: ["command"]
      }
    }
    this.hooks = {
      // Regular hooks (and command)
      "before:demo:command": () => { this.hook("before:demo:command") },
      "demo:command": this.command.bind(this),
      "after:demo:command": () => { this.hook("after:demo:command") },
      // Core hooks
      "before:pluginManager:loadAllPlugins": this.coreHook.bind(this),
      "before:utils:getVersion": this.coreHook.bind(this),
      "after:serverless:set:instanceId": this.coreHook.bind(this)
    }
    this.load();
  }

  command() {
    this.log("Hi, I'm a command!");
    this.log("> Try setting SLS_CH_DEBUG=1 to see debugging info.");
  }

  coreHook(event, trigger) {
    this.log(`# core hook ${trigger}:${event} ${util.inspect(event)}`);
  }

  hook(trigger) {
    this.log("$ regular hook " + trigger);
  }

  load() {
    // Plugin loaded by pluginManager
    this.log("Hello, I'm an instruction in the plugin load.", true);
    this.log("> You should see me twice!", true);
    if (this.sls._chDemoLoaded) {
      // Plugin loaded before, skips
      return;
    }
    // Plugin enabled only with 'demo' command
    if (this.sls.processedInput.commands.includes("demo")) {
      this.sls._chDemoEnabled = true;
      return;
    }
    this.log("Plugin active but most output suppressed.", true);
    this.log("> Use 'demo' command to check it out!", true);
    // Plugin loaded
    this.sls._chDemoLoaded = true;
  }

  log(message, force = false) {
    message = message.replace(/[\r\n\t]/g, "");
    message = message.replace(/\s+/g, " ");
    if (this.sls._chDemoEnabled || force) {
      this.sls.cli.log("[CH Demo] " + message);
    }
  }
}

module.exports = CoreHooksDemo;
