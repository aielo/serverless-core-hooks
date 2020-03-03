class CHTest {
  constructor(serverless) {
    const self = this;
    const triggers = [
      "before:core:init",
      "before:core:init",
      "after:core:init",
      "before:core:run",
      "after:core:run",
      "before:core:pluginmanager:loadallplugins",
      "after:core:pluginmanager:loadallplugins",
      "before:core:pluginmanager:addplugin",
      "after:core:pluginmanager:addplugin",
      "before:core:utils:getversion",
      "after:core:utils:getversion",
    ];
    self.hooks = {}
    for (const trigger of triggers) {
      self.hooks[trigger] = function () {
        const args = [...Object.values(arguments)];
        self.hook(trigger, args);
      }
    }
    this.commands = {
      chtest: {
        usage: "Does nothing except test CoreHooks",
        lifecycleEvents: ["command"]
      }
    }
    this.hooks["chtest:command"] = self.command.bind(self);
    this.load();
  }

  command() {
    let message = "Hi, I'm a command!";
    message += " Checkout what triggered before and after me.";
    console.log(message);
  }

  load() {
    let message = "Hello, I'm an instruction during plugin load.";
    message += " See how many times I actually ran. (hint: 2)";
    console.log(message);
  }

  hook(trigger, args) {
    // console.log(args);
    let message = "Hook triggered: " + trigger + " args [" + args + "]";
    message = message.replace(/[\r|\n|\t]/g, "");
    console.log(message);
  }

}

module.exports = CHTest;
