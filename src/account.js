const assert = require('assert');
const _ = require('lodash');
const bcrypt = require('bcrypt');

const USERS = {
  '23121d3c-84df-44ac-b458-3d63a9a05497': {
    email: 'foo@example.com',
    passwordHash: '$2b$10$NxWMEGxm4TPLlEdEKQPObuEdIk5P36HUNTTA3b/5d3V.Hy79yJ72G', // foo
    email_verified: true,
  },
  'c2ac2b4a-2262-4e2f-847a-a40dd3c4dcd5': {
    email: 'bar@example.com',
    passwordHash: '$2b$10$Zc5qdmcx6nLmdpYPzTO/Nek9dveLeZy3J1nZJMUieDlhKkQwW3GpG', // bar
    email_verified: false,
  },
};

class Account {
  constructor(id) {
    this.accountId = id; // the property named accountId is important to oidc-provider
  }

  // claims() should return or resolve with an object with claims that are mapped 1:1 to
  // what your OP supports, oidc-provider will cherry-pick the requested ones automatically
  claims() {
    return Object.assign({}, USERS[this.accountId], {
      sub: this.accountId,
    });
  }

  static async findById(ctx, id) {
    // this is usually a db lookup, so let's just wrap the thing in a promise, oidc-provider expects
    // one
    return new Account(id);
  }

  static async authenticate(email, password) {

    // Assert that email and password are provided
    assert(password, 'password must be provided');
    assert(email, 'email must be provided');

    // Retrieve user id and assert that user exists
    const lowercased = String(email).toLowerCase();
    const id = _.findKey(USERS, { email: lowercased });
    assert(id, 'invalid credentials provided');

    // Verify password and return instance of Account if valid
    let isCorrect = bcrypt.compareSync(password, USERS[id].passwordHash)
    if (isCorrect) {
      return new this(id)
    } else {
      throw new Error('Password is incorrect')
    }
  }
}

module.exports = Account;
