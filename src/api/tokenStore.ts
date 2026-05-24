// Refresh token now lives in an HttpOnly Secure cookie on /api/auth
// (set by the backend on login/refresh). Access token lives only in
// memory — lost on full page reload, recovered by calling /auth/refresh
// during AuthContext bootstrap.

let accessToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  setAccess(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};
