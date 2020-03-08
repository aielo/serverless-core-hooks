"use strict"

const _ = require("lodash");
const CHObjects = require("./utils/CHObjects");
const CHHooks = require("./utils/CHHooks");

class CoreHooks {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      "internal:pluginManager:loadAllPlugins": this.onLoadAllPlugins.bind(this)
    };
    this.config = {
      core: _.get(serverless, "service.custom.coreHooks.objects", []),
      internal: ["serverless", "pluginManager"]
    };
    this.objects = { core: [], internal: [] };
    if (!_.isArray(this.config.core) || _.isEmpty(this.config.core)) {
      // Skips plugin load: no core objects specified
      this.log("No core objects to hook ('custom.coreHooks.objects')");
    } else if (_.has(serverless, "_chPlugin")) {
      // Skips plugin load: already loaded (i.e. all set)
    } else {
      this.load(serverless);
    }
  }

  // Activates core objects (i.e. events start triggering)
  activate() {
    CHObjects.activate(...this.objects.core);
  }

  // Loads Core Hooks plugin
  load() {
    // Utils set up
    CHObjects.CHHooks = CHHooks;
    CHHooks.pluginManager = this.serverless.pluginManager;
    CHHooks.logger = CHObjects.logger = this;

    this.serverless.serverless = this.serverless;
    let sls = this.serverless;
    let pm = sls.pluginManager;

    // Serverless.run: overridden to force additional cycle (of init and run)
    const self = this;
    const run = sls.run;                  // preserved
    sls.run = function () {
      self.activate();
      self.log("core hooks active");
      sls.init().then(() => {
        CHObjects.extract(sls).run = run; // restored
        sls.run(..._.values(arguments));  // might trigger
      });
    }
    self.log("serverless.run ready to kick start new cycle");

    // Objects replaced with core objects (i.e. their proxies)
    const objects = _.concat(this.config.internal, this.config.core);
    _.each(_.uniq(objects), (name) => {
      const core = _.includes(this.config.core, name);
      const internal = _.includes(this.config.internal, name);
      sls[name] = CHObjects.create(name, sls[name], internal);
      if (_.has(sls[name], "serverless")) {
        // Circular reference to serverless core object
        sls[name].serverless = sls["serverless"];
      }
      if (internal) {
        // Add to internal object list
        this.objects.internal.push(sls[name]);
      }
      if (core) {
        // Add to core object list
        this.objects.core.push(sls[name]);
        // Core objects reassignment hooks
        const hook = "internal:serverless:set:" + name;
        this.hooks[hook] = this.onCoreObjectAssignment.bind(this);
      }
    });
    sls = sls.serverless;
    // Plugin tied to serverless to indicate it has been loaded
    sls._chPlugin = this;
  }

  // Logs (with support to both Serverless and Core Hooks only flags)
  log(message) {
    if (message && (process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      message = "[CH] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      // Core object triggers prevented on plugin logs
      const cli = CHObjects.extract(this.serverless.cli);
      cli.log(message);
    }
  }

  // Ensures core hook objects live thru reassignment (i.e. keep proxied)
  onCoreObjectAssignment(event) {
    const object = event.target[event.key];
    if (CHObjects.isCoreObject(object)) {
      event.value = CHObjects.create(event.key, event.value);
      CHObjects.activate(event.value);
    }
  }

  // Reloads all plugins after clearing up pluginManager
  onLoadAllPlugins(event) {
    const self = this;
    const pm = event.target;
    const sls = CHObjects.extract(pm.serverless);
    // .loadAllPlugins overridden to force reload of plugins
    pm["_ch" + event.key] = pm[event.key];
    pm[event.key] = function () {
      pm.plugins = [];
      pm.commands = {};
      pm.aliases = {};
      pm.hooks = {};
      self.log("pluginManager cleared and ready to reload all plugins");
      // Call thru core object (proxy) to trigger internal events
      sls.pluginManager["_ch" + event.key](..._.values(arguments));
      self.log("pluginManager reloaded all plugins");
    }
  }
}

module.exports = CoreHooks;
