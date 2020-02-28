"use strict"

class CoreHooks {
  constructor(serverless) {
    this.config = "hello cruel world";
    this.load();
  }

  load() {
    console.log(this.config);
  }
}

module.exports = CoreHooks;
