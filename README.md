# Make SingPass Great Again

_Implying that SingPass was great at some time? Unclear_

This is an implementation of [oidc-provider documentation](https://github.com/panva/node-oidc-provider#oidc-provider)
attained by following step by step instructions from https://github.com/panva/node-oidc-provider-example

Note from the example:
Features such as sign-up, password resets and security measures like csrf, rate limiting, captcha - that's all on you and isn't a part of the protocol implementation provided by oidc-provider.

Next steps for deployment:

- Get this running using cluster mode spread across several hosts, behind haproxy, nginx, or
  ELB
- Figure out what data store is best (currently usinr Redis) from the adapters available for MongoDB, PostgreSQL, redis, DynamoDB, REST Api, or create our own
