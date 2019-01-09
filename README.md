# Make SingPass Great Again

_Implying that SingPass was great at some time? Unclear_

This is an implementation of [oidc-provider documentation](https://github.com/panva/node-oidc-provider#oidc-provider)
attained by following [step by step instructions](https://github.com/panva/node-oidc-provider-example)

Note from the example:

> Features such as sign-up, password resets and security measures like csrf, rate limiting, captcha - that's all on you and isn't a part of the protocol implementation provided by oidc-provider.

Ignore the environments listed above, they're inaccurate. Code is deployed at:
- code on `master` branch goes to sheltered-taiga-28604.herokuapp.com
- code on `staging` branch goes to singpass-staging.herokuapp.com

To get started:

- Follow instructions [here](https://medium.freecodecamp.org/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec) to set up HTTPS on your local machine

To test, go to /auth?client_id=foo&response_type=id_token+token&scope=openid+email&nonce=foobar&prompt=login
