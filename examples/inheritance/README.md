### Example: Inheritance

`serverless-core-hooks` is extended by other plugin in this example.

Core objects are provided by overriding the `configure` method. That means no explicit configuration in serverless file; `serverless-core-hooks` is not required in the plugins section either.

Try it with `npm`:
```
$ git clone https://github.com/aielo/serverless-core-hooks.git
$ cd serverless-core-hooks/examples/inheritance/
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
