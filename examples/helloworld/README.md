### Example: Hello World

This is the simplest example of a plugin using `serverless-core-hooks`.
Different hooks are set to build and then print two messages.

Try it with `npm`:
```
$ git clone https://github.com/aielo/serverless-core-hooks.git
$ cd serverless-core-hooks/examples/helloworld/
$ npm install serverless -g
$ npm install
$ sls print
```
or `yarn`:
```
...
$ yarn global add serverless
$ yarn install
$ sls print
```
This installs `serverless` globally and `serverless-core-hooks` as a dependency.
To use the local `serverless-core-hooks` rather than installing it, do:
```
$ git clone https://github.com/aielo/serverless-core-hooks.git
$ cd serverless-core-hooks
$ npm install serverless -g
$ npm install
$ cd examples/helloworld/
$ sls --config serverless-local.yml print
```

For debug output, use `SLS_CH_DEBUG` or `SLS_DEBUG`:
```
$ SLS_CH_DEBUG=1 sls print
```