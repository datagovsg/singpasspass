const querystring = require('querystring');

const { urlencoded } = require('express'); // eslint-disable-line import/no-unresolved

const Account = require('./account');

const body = urlencoded({ extended: false });

module.exports = (app, provider) => {
  const {
    constructor: {
      errors: { SessionNotFound },
    },
  } = provider;

  function setNoCache(req, res, next) {
    res.set('Pragma', 'no-cache');
    res.set('Cache-Control', 'no-cache, no-store');
    next();
  }

  app.get('/interaction/:grant', setNoCache, async (req, res, next) => {
    try {
      const details = await provider.interactionDetails(req);
      const client = await provider.Client.find(details.params.client_id);

      if (details.interaction.error === 'login_required') {
        return res.render('login', {
          client,
          details,
          title: 'Sign-in',
          params: querystring.stringify(details.params, ',<br/>', ' = ', {
            encodeURIComponent: value => value,
          }),
          interaction: querystring.stringify(
            details.interaction,
            ',<br/>',
            ' = ',
            {
              encodeURIComponent: value => value,
            },
          ),
        });
      }
      return res.render('interaction', {
        client,
        details,
        title: 'Authorize',
        params: querystring.stringify(details.params, ',<br/>', ' = ', {
          encodeURIComponent: value => value,
        }),
        interaction: querystring.stringify(
          details.interaction,
          ',<br/>',
          ' = ',
          {
            encodeURIComponent: value => value,
          },
        ),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post(
    '/interaction/:grant/confirm',
    setNoCache,
    body,
    async (req, res, next) => {
      try {
        const result = { consent: {} };
        await provider.interactionFinished(req, res, result);
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    '/interaction/:grant/login',
    setNoCache,
    body,
    async (req, res, next) => {
      // try {
      //   const account = await Account.findByLogin(req.body.login);

      //   const result = {
      //     login: {
      //       account: account.accountId,
      //       acr: 'urn:mace:incommon:iap:bronze',
      //       amr: ['pwd'],
      //       remember: !!req.body.remember,
      //       ts: Math.floor(Date.now() / 1000),
      //     },
      //     consent: {},
      //   };

      //   await provider.interactionFinished(req, res, result);
      // } catch (err) {
      //   next(err);
      // }
      console.log('/interaction/:grant/login endpoint');
      Account.authenticate(req.body.email, req.body.password)
        .then(account => provider.interactionFinished(req, res, {
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
    },
  );

  app.use((err, req, res, next) => {
    if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
    }
    next(err);
  });
};
