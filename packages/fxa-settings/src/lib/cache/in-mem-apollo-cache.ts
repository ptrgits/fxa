/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { gql, InMemoryCache } from '@apollo/client';
import { Email } from '../../models';
import config from '../config';
import { getCurrentAccount } from './account-cache';
import { InvalidCachedAccountState, MissingCachedAccount } from './errors';

// sessionToken is added as a local field as an example.
export const typeDefs = gql`
  extend type Account {
    primaryEmail: Email!
  }
  extend type Session {
    token: String!
  }
`;

export const apolloMemCache = new InMemoryCache({
  typePolicies: {
    Account: {
      fields: {
        primaryEmail: {
          read(_, o) {
            const emails = o.readField<Email[]>('emails');
            return emails?.find((email) => email.isPrimary);
          },
        },
      },
      keyFields: [],
    },
    Avatar: {
      fields: {
        isDefault: {
          read(_, o) {
            const url = o.readField<string>('url');
            const id = o.readField<string>('id');
            return !!(
              url?.startsWith(config.servers.profile.url) ||
              id?.startsWith('default')
            );
          },
        },
      },
    },
    Session: {
      fields: {
        token: {
          read() {
            const account = getCurrentAccount();

            if (account == null) {
              // TBD - What do we do...
              throw new MissingCachedAccount();
            }

            if (account?.sessionToken == null) {
              // TBD - What do we do
              throw new InvalidCachedAccountState('Missing session token');
            }

            // This feels off to me. I think we should be doing a write and keeping
            // apollo's cache up to date when se set the current account instead of
            // hijacking it like this.
            return account.sessionToken;
          },
        },
      },
    },
  },
});

export function setRecoveryKeyExists(exists: boolean) {}

export const apolloCache = {
  setPasswordCreated(passwordCreated: number) {
    apolloMemCache.modify({
      id: apolloMemCache.identify({ __typename: 'Account' }),
      fields: {
        passwordCreated() {
          return passwordCreated;
        },
      },
    });
  },

  setRecoveryKeyExists(exists: boolean) {
    apolloMemCache.modify({
      id: apolloMemCache.identify({ __typename: 'Account' }),
      fields: {
        recoveryKey() {
          return {
            exists,
          };
        },
      },
    });
  },
};
