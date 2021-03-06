"use strict"

const _ = require("lodash");
const CHHooks = require("./utils/CHHooks");
const CHObjects = require("./utils/CHObjects");

class CoreHooks {
  constructor(serverless) {
    this.sls = serverless;
    // Hooks and objects configuration
    this.configure();
    if (!_.isArray(this.config.core) || _.isEmpty(this.config.core)) {
      // Skips plugin load: no core objects specified
      this._log("No core objects to hook");
    } else if (_.has(this, "sls._chPlugin")) {
      // Skips plugin load: already loaded (i.e. all set)
    } else {
      // Plugin load
      this.load();
    }
  }

  // Activates core objects (i.e. events start triggering)
  activate() {
    CHObjects.activate(...this.objects.core);
  }

  // Sets/changes plugin configuration
  configure() {
    this._configure();
  }

  // Loads plugin
  load() {
    this._load();
  }

  // Logs (support to both Serverless and Core Hooks only flags)
  log(message, internal = false) {
    if (!message) {
      return;
    }
    if (internal && !(process.env.SLS_DEBUG || process.env.SLS_CH_DEBUG)) {
      // Internal log ignored with no debug flag
      return;
    }
    const prefix = internal ? "[CH] " : _.get(this, "config.logPrefix", "");
    message = message.replace(/[\r\n\t]/g, "");
    message = message.replace(/\s+/g, " ");
    // Core object triggers prevented
    const cli = CHObjects.extract(this.sls.cli);
    cli.log(prefix + message);
  }

  // Configures Core Hook plugin
  _configure() {
    // Internal hooks
    this.hooks = {
      "internal:pluginManager:loadAllPlugins": this._onLoadAllPlugins.bind(this),
      "internal:serverless:set:instanceId": this._onSetInstanceId.bind(this)
    };
    // Core/internal objects
    this.config = {
      core: _.get(this, "sls.service.custom.coreHooks.objects", []),
      internal: ["serverless", "pluginManager"]
    };
    this.objects = { core: [], internal: [] };
  }

  // Loads Core Hooks plugin
  _load() {
    // CHObjects and CHHooks utils set up
    CHObjects.CHHooks = CHHooks;
    CHHooks.pluginManager = this.sls.pluginManager;
    CHHooks.logger = CHObjects.logger = this;
    // Core objects (i.e. proxies) replace original objects
    let sls = this.sls;
    sls.serverless = sls; // core objects children of sls (itself included)
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
        this.hooks[hook] = this._onCoreObjectAssignment.bind(this);
      }
    });
    sls = sls.serverless; // core object retrieve
    // serverless.run: override to force additional cycle (of .init and .run)
    const self = this;
    sls._chRun = CHObjects.extract(sls).run;
    CHObjects.extract(sls).run = function () {
      self.activate();
      self._log("core hooks are now active");
      sls.init().then(() => {
        CHObjects.extract(sls).run = sls._chRun;
        sls.run(..._.values(arguments));
      });
    }
    this._log("serverless.run ready to kick start new cycle");
    // Plugin tied to serverless to indicate it has been loaded
    sls._chPlugin = this;
  }

  // Logs
  _log(message) {
    this.log(message, true);
  }

  // Ensures core hook objects live thru reassignment (i.e. keep proxied)
  _onCoreObjectAssignment(event) {
    const object = event.target[event.key];
    if (CHObjects.isCoreObject(object)) {
      event.value = CHObjects.create(event.key, event.value);
      CHObjects.activate(event.value);
    }
  }

  // Reloads all plugins after clearing up pluginManager
  _onLoadAllPlugins(event) {
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
      self._log("pluginManager cleared and ready to reload all plugins");
      // Call thru core object (proxy) to trigger internal events
      sls.pluginManager["_ch" + event.key](..._.values(arguments));
      self._log("pluginManager reloaded all plugins");
      // Internal hook removed (triggers only once)
      pm.hooks["internal:pluginManager:loadAllPlugins"] = [];
    }
  }

  // Prevents serverless.instanceId override in .init (of new cycle)
  _onSetInstanceId(event) {
    const self = this;
    const sls = event.target;
    const pm = CHObjects.extract(sls.pluginManager);
    event.value = sls[event.key];
    self._log("serverless.instanceId preserved");
    // Internal hook removed (triggers only once)
    pm.hooks["internal:serverless:set:instanceId"] = [];
  }
}

module.exports = CoreHooks;
