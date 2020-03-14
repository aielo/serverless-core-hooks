# serverless-core-hooks ![npm](https://img.shields.io/npm/v/serverless-core-hooks) ![npm](https://img.shields.io/npm/l/serverless-core-hooks)


A plugin which enables hooks in events of core serverless objects.

First things first - **serverless-core-hooks** enables other plugins.
It does not accomplish much by itself.

Having said that, it allows your own plugin to hook into (almost) any point of the the [Serverless Framework](http://www.serverless.com). A good understanding of serverless and its flow might empower the use of **serverless-core-hooks** (i.e. YMMV).

## What do I need this for?
Let's say you needed to audit a few steps which happen during initialization (`serverless.init`). For example, when and which plugins are loaded (`pluginManager.addPlugin`). There are no available hooks for that - they will be loaded in there.

Or imagine you want to add or change information to the configuration loaded from `serverless.yml` on runtime. Unless it's something as simple as an arg (`opt`) or environment variable (`env`), you have to switch configuration from YML to JS (e.g. `serverless.js`) to have a more dynamic capability.

The purpose of **serverless-core-hooks** is to provide means for your plugins to handle those types of requirement. The latter is actually what motivated its creation.

## How does it work?
You can either inherit or use it directly from serverless configuration. Both ways are described below in more details.

### Inheritance
1. You create your own plugin, extending **serverless-core-hooks**:
```
const CoreHooks = require("serverless-core-hooks");
class MyPlugin extends CoreHooks {
  constructor(sls) {
    super(sls);
  }
...
```
2. Then you override the `configure` method to **specify which core object(s) you want to hook**:
```
...
  configure() {
    super.configure();
    this.config.core.push("serverless", "cli"); // adds (!replace)
...
```
3. **Core hooks** might also be added:
```
...
    Object.assign(this.hooks, { // adds/merges (!replace)
      "before:serverless:init": this.myHook.bind(this),
      "after:serverless:run": this.myHook.bind(this),
    });
  }
  myHook(event, trigger) {
    this.log("core hooking some methods");
  }
}
module.exports = MyPlugin;
```

### Direct serverless configuration
1. You **specify which core object(s) you want to hook** via configuration:
```
...
custom:
  coreHooks:
    objects:
      - serverless
      - pluginManager
...
```
2. Then you **setup and use core hooks in your plugin**, on a similar fashion to regular ones:
```
class MyPlugin {
  constructor(sls) {
    this.sls = sls;
    this.hooks = {
      "after:serverless:run": this.myHook.bind(this)
    };
  }
  myHook(event, trigger) {
    this.sls.cli.log("Serverless run ended");
  }
}
module.exports = MyPlugin;
```
3. Done! Actually, do not forget to **add both plugins to your configuration**:
```
...
plugins:
  - serverless-core-hooks
  - my-plugin
...
```

## Which objects can I hook?
Currently, it is possible to hook the `serverless` instance and all its children - we call them *core objects* here. They are listed below:
- `cli`
- `pluginManager`
- `serverless`
- `service`
- `utils`
- `variables`
- `yamlParser`

## Examples
- [Hello World](https://github.com/aielo/serverless-core-hooks/tree/master/examples/helloworld)
- [Demo](https://github.com/aielo/serverless-core-hooks/tree/master/examples/demo)
- [Inheritance](https://github.com/aielo/serverless-core-hooks/tree/master/examples/inheritance)

## Author
Ricardo Aielo [@aielo](https://github.com/aielo/)

## License
**serverless-core-hooks** is licensed under the ISC License.