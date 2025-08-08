import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client';
import AuthClient from 'fxa-auth-client/browser';
import { clearSignedInAccountUid, getCurrentAccount } from '../lib/cache';
import { GET_LOCAL_SIGNED_IN_STATUS } from '../components/App/gql';
import * as Sentry from '@sentry/browser';

export interface SessionData {
  verified: boolean | null;
  verifySession?: (
    code: string,
    options: {
      service?: string;
      scopes?: string[];
      marketingOptIn?: boolean;
      newsletters?: string[];
    }
  ) => Promise<void>;
  destroy?: () => void;
}

export const GET_SESSION_VERIFIED = gql`
  query GetSession {
    session {
      verified
    }
  }
`;

export const GET_SESSION_IS_VALID = gql`
  query GetSessionIsValid($sessionToken: String!) {
    isValidToken(sessionToken: $sessionToken)
  }
`;

export const DESTROY_SESSION = gql`
  mutation DestroySession {
    destroySession(input: {}) {
      clientMutationId
    }
  }
`;

export class Session implements SessionData {
  private readonly authClient: AuthClient;

  // TBD: Why isn't this a typed object! Or at least, NormalizedCacheObject...
  private readonly apolloClient: ApolloClient<object>;

  constructor(
    authClient: AuthClient,
    apolloClient: ApolloClient<NormalizedCacheObject>
  ) {
    this.authClient = authClient;
    this.apolloClient = apolloClient;
  }

  private get data(): Session | null {
    const result = this.apolloClient.cache.readQuery<{
      session: Session;
    }>({
      query: GET_SESSION_VERIFIED,
    });

    if (result?.session) {
      return result.session;
    }

    return null;
  }

  get verified(): boolean {
    if (this.data) {
      return this.data.verified;
    }
    return false;
  }

  async verifySession(
    code: string,
    options: {
      service?: string;
      scopes?: string[];
      marketingOptIn?: boolean;
      newsletters?: string[];
    } = {}
  ) {
    let success = false;
    const token = getCurrentAccount()?.sessionToken;
    if (token) {
      try {
        const result = await this.authClient.sessionVerifyCode(
          token,
          code,
          options
        );
        success = true;
      } catch (err) {
        // Capture this for now, just so we can keep an eye on things
        Sentry.captureException(err);
      }
    }

    // TBD: Pretty sure we wanted to change this session.verified is true
    this.apolloClient.cache.modify({
      fields: {
        session: () => {
          return {
            verified: success,
          };
        },
      },
    });

    // TBD: Very unclear. Why are we setting this here? This action has to do with session.verify, not with isSigned!
    // I'd think the user was already signed in if they got to this point.
    this.apolloClient.cache.writeQuery({
      query: GET_LOCAL_SIGNED_IN_STATUS,
      data: { isSignedIn: success },
    });
  }

  async sendVerificationCode() {
    const token = getCurrentAccount()?.sessionToken;
    if (token != undefined) {
      await this.authClient.sessionResendVerifyCode(token);
    }
  }

  async destroy() {
    await this.apolloClient.mutate({
      mutation: DESTROY_SESSION,
      variables: { input: {} },
    });

    clearSignedInAccountUid();
  }

  get isDestroyed() {
    return getCurrentAccount() == null;
  }

  async isSessionVerified() {
    const query = GET_SESSION_VERIFIED;
    const { data } = await this.apolloClient.query({
      fetchPolicy: 'network-only',
      query,
    });

    const { session } = data;
    const sessionStatus: boolean = session.verified;

    this.apolloClient.cache.modify({
      fields: {
        session: () => {
          return sessionStatus;
        },
      },
    });
    return sessionStatus;
  }

  async isValid(sessionToken: string) {
    // If the current session token is valid, the following query will succeed.
    // If current session is not valid an 'Invalid Token' error will be thrown.
    const query = GET_SESSION_IS_VALID;
    const { data } = await this.apolloClient.query({
      fetchPolicy: 'network-only',
      query,
      variables: { sessionToken },
    });
    if (data?.isValidToken === true) {
      this.apolloClient.cache.writeQuery({
        query: GET_LOCAL_SIGNED_IN_STATUS,
        data: { isSignedIn: true },
      });
      return true;
    }

    return false;
  }
}
