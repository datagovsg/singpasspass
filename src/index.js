const assert = require('assert');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Provider = require('oidc-provider');
const helmet = require('helmet');

if (process.env.NODE_ENV === 'production') {
  // since dyno metadata is no longer available, we infer the app name from heroku remote we set
  // manually. This is not specific to oidc-provider, just an easy way of getting up and running
  if (!process.env.HEROKU_APP_NAME && process.env.X_HEROKU_REMOTE) {
    process.env.X_HEROKU_REMOTE.match(/\.com\/(.+)\.git/);
    process.env.HEROKU_APP_NAME = RegExp.$1;
  }
  assert(
    process.env.SECURE_KEY,
    'process.env.SECURE_KEY missing, run `heroku addons:create securekey`',
  );
  assert.equal(
    process.env.SECURE_KEY.split(',').length,
    2,
    'process.env.SECURE_KEY format invalid',
  );
}
assert(
  process.env.REDIS_URL,
  'process.env.REDIS_URL missing, run `heroku-redis:hobby-dev`',
);

// set defaults for local usage
const { PORT = 3000, ISSUER = 'http://redis_db:6739', TIMEOUT } = process.env;

const RedisAdapter = require('./redis_adapter');

// simple account model for this application, user list is defined like so
const Account = require('./account');

const oidc = new Provider(
  ISSUER, //  `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`,
  {
    cookies: {
      short: {
        secure: true,
      },
      long: {
        secure: true,
      },
    },
    // oidc-provider only looks up the accounts by their ID when it has to read the claims,
    // passing it our Account model method is sufficient, it should return a Promise that resolves
    // with an object with accountId property and a claims method.
    findById: Account.findById,

    // let's tell oidc-provider we also support the email scope, which will contain email and
    // email_verified claims
    claims: {
      // scope: [claims] format
      openid: ['sub'],
      email: ['email', 'email_verified'],
    },

    // let's tell oidc-provider where our own interactions will be
    // setting a nested route is just good practice so that users
    // don't run into weird issues with multiple interactions open
    // at a time.
    interactionUrl(ctx) {
      return `/interaction/${ctx.oidc.uuid}`;
    },
    formats: {
      AccessToken: 'jwt',
    },
    features: {
      // disable the packaged interactions
      devInteractions: false,

      claimsParameter: true,
      discovery: true,
      encryption: true,
      introspection: true,
      registration: true,
      request: true,
      revocation: true,
      sessionManagement: true,
    },
  },
);

if (TIMEOUT) {
  oidc.defaultHttpOptions = { timeout: parseInt(TIMEOUT, 10) };
}

const keystore = require('./keystore.json');

oidc
  .initialize({
    keystore,
    clients: [
      // reconfigured the foo client for the purpose of showing the adapter working
      {
        client_id: 'email-your-mp',
        redirect_uris: ['https://peaceful-yonath-ac1071.netlify.com'],
        response_types: ['id_token token'],
        grant_types: ['implicit'],
        token_endpoint_auth_method: 'none',
      },
    ],
    adapter: RedisAdapter,
  })
  .then(() => {
    oidc.proxy = true;
    oidc.keys = process.env.SECURE_KEY.split(',');
  })
  .then(() => {
    const app = express();

    // security
    app.use(helmet());
    app.set('trust proxy', true);

    // UI
    app.set('view engine', 'ejs');
    app.set('views', path.resolve(__dirname, 'views'));

    const parse = bodyParser.urlencoded({ extended: false });

    app.get('/interaction/:grant', async (req, res) => {
      oidc.interactionDetails(req).then((details) => {
        console.log(
          'see what else is available to you for interaction views',
          details,
        );

        const view = (() => {
          switch (details.interaction.reason) {
            case 'consent_prompt':
            case 'client_not_authorized':
              return 'interaction';
            default:
              return 'login';
          }
        })();

        res.render(view, { details });
      });
    });

    app.post('/interaction/:grant/confirm', parse, (req, res) => {
      oidc.interactionFinished(req, res, {
        consent: {
          // TODO: add offline_access checkbox to confirm too
        },
      });
    });

    app.post('/interaction/:grant/login', parse, (req, res, next) => {
      Account.authenticate(req.body.email, req.body.password)
        .then(account => oidc.interactionFinished(req, res, {
            login: {
              account: account.accountId,
              remember: !!req.body.remember,
              ts: Math.floor(Date.now() / 1000),
            },
            consent: {
              rejectedScopes: req.body.remember ? [] : ['offline_access'],
            },
          }),)
        .catch(next);
    });

    // leave the rest of the requests to be handled by oidc-provider, there's a catch all 404 there
    app.use(oidc.callback);

    // express listen
    app.listen(process.env.PORT);
  });
