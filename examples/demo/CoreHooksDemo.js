"use strict"

class CoreHooksDemo {
  constructor(serverless) {
    const self = this;
    const triggers = [
      "before:core:init",
      "before:core:init",
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
    self.load();
  }

  command() {
    let message = ">> Hi, I'm a command!";
    message += " Checkout what triggered before and after me.";
    console.log(message);
    message = ">> Try setting SLS_CH_DEBUG=1 to see debugging info.";
    console.log(message);
  }

  load() {
    let message = ">> Hello, I'm an instruction during plugin load.";
    message += " See how many times I actually ran. (hint: 2)";
    console.log(message);
  }

  hook(trigger, ...args) {
    let message = "Hook triggered: " + trigger + " with ";
    if (args.length == 0) {
      message += "no args";
    } else {
      message += "args " + JSON.stringify(args);
    }
    message = message.replace(/[\r\n\t]/g, "");
    console.log(message);
  }
}

module.exports = CoreHooksDemo;
