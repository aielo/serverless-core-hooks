### Example: Demo

This is a plugin which demonstrates `serverless-core-hooks` and its flow.
It contains a `demo` command and both regular and core hooks.
Run it with `SLS_CH_DEBUG` to see the outputs and check out its source code.

Try it with `npm`:
```
$ git clone https://github.com/aielo/serverless-core-hooks.git
$ cd serverless-core-hooks/examples/demo/
$ npm install serverless -g
$ npm install
$ sls demo
```
or `yarn`:
```
...
$ yarn global add serverless
$ yarn install
$ sls demo
```
This installs `serverless` globally and `serverless-core-hooks` as a dependency.
To use the local `serverless-core-hooks` rather than installing it, do:
```
$ git clone https://github.com/aielo/serverless-core-hooks.git
$ cd serverless-core-hooks
$ npm install serverless -g
$ npm install
$ cd examples/demo/
$ sls --config serverless-local.yml demo
```
