### Example: Hello World

This is the simplest example of a plugin using `serverless-core-hooks`.

Different core hooks are set to build and then print two messages.

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

For debugging output, use `SLS_CH_DEBUG` or `SLS_DEBUG`:
```
$ SLS_CH_DEBUG=1 sls print
```
