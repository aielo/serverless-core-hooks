"use strict"

class CoreHooksDemo {
  constructor(serverless) {
    this.sls = serverless;
    const self = this;
    const triggers = [
      "before:core:run",
      "before:core:cli:setloadedplugins",
      "before:core:pluginmanager:loadallplugins",
      "before:core:pluginmanager:addplugin",
      "before:core:pluginmanager:run",
      "before:core:utils:getversion",
      "before:demo:command",
      "after:core:init",
      "after:core:run",
      "after:core:pluginmanager:loadallplugins",
      "after:core:pluginmanager:addplugin",
      "after:core:pluginmanager:run",
      "after:core:utils:getversion",
      "after:core:service:mergearrays",
      "after:core:variables:populateservice",
      "after:core:pluginmanager:run",
      "after:demo:command"
    ];
    self.hooks = {}
    for (const trigger of triggers) {
      self.hooks[trigger] = function () {
        const args = Object.values(arguments);
        self.hook(trigger, ...args);
      }
    }
    self.commands = {
      demo: {
        usage: "Does nothing except test CoreHooks",
        lifecycleEvents: ["command"]
      }
    }
    self.hooks["demo:command"] = self.command.bind(self);
    self.hooks["before:core:init"] = self.enable.bind(self);
    self.load();
  }

  command() {
    let message = "Hi, I'm a command!";
    message += " Checkout what triggered before and after me.";
    this.log(message);
    message = "Try setting SLS_CH_DEBUG=1 to see debugging info.";
    this.log(message);
  }

  enable() {
    if (this.sls.processedInput.commands.includes("demo")) {
      this.sls._demoEnabled = true;
    } else {
      this.log("Demo is active but hooks output is suppressed.");
      this.log("Use the 'demo' command to check it out!");
    }
  }

  hook(trigger, ...args) {
    let message = "Core hook triggered: " + trigger + " with ";
    if (args.length == 0) {
      message += "no args";
    } else {
      message += "args " + JSON.stringify(args);
    }
    message = message.replace(/[\r\n\t]/g, "");
    if (this.sls._demoEnabled) {
      console.log(">> " + message);
    }
  }

  load() {
    let message = "Hello, I'm an instruction in the plugin load.";
    message += " See how many times I ran. (expected: 2)";
    this.log(message);
  }

  log(message) {
    this.sls.cli.log("[Demo] " + message);
  }
}

module.exports = CoreHooksDemo;
