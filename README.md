# Make SingPass Great Again

_Implying that SingPass was great at some time? Unclear_

This is an implementation of [oidc-provider documentation](https://github.com/panva/node-oidc-provider#oidc-provider)
attained by following [step by step instructions](https://github.com/panva/node-oidc-provider-example)

Note from the example:

> Features such as sign-up, password resets and security measures like csrf, rate limiting, captcha - that's all on you and isn't a part of the protocol implementation provided by oidc-provider.

Next steps for deployment:

- Get this running using cluster mode spread across several hosts, behind haproxy, nginx, or
  ELB
- Figure out what data store is best (currently using Redis) from the adapters [available](https://github.com/panva/node-oidc-provider/tree/master/example/adapters) for MongoDB, PostgreSQL, redis, DynamoDB, REST Api, or create our own. Choices

For deploys:

- code on `master` branch goes to sheltered-taiga-28604.herokuapp.com
- code on `staging` branch goes to singpass-staging.herokuapp.com
