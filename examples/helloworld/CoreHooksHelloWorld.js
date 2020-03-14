"use strict"

class CoreHooksHelloWorld {
  constructor(serverless) {
    this.sls = serverless;
    this.hooks = {
      "before:serverless:init": this.before.bind(this),
      "after:serverless:init": this.after.bind(this),
      "after:serverless:run": this.print.bind(this)
    }
  }

  before(event, trigger) {
    this.log("# core hook " + trigger + ":" + event);
    // Via plugin context
    this.sls._chHWMessage = "Hello";
    // Via event object
    event.target._chHWMensaje = "Hola";
  }

  after(event, trigger) {
    this.log("# core hook " + trigger + ":" + event);
    this.sls._chHWMessage += " World!";
    event.target._chHWMensaje += " Mundo!";
  }

  print(event, trigger) {
    this.log("# core hook " + trigger + ":" + event);
    let message = "> " + this.sls._chHWMessage;
    let mensaje = "> " + event.target._chHWMensaje;
    this.log(message);
    this.log(mensaje);
  }

  log(message) {
    this.sls.cli.log("[CH HelloWorld] " + message);
  }
}

module.exports = CoreHooksHelloWorld;
