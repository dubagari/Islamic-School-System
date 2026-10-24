import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { User } from "@/types";

export type LoginResponse = {
  user: User;
  token: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
};

const STORAGE_KEY = "dums.auth";

function readStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(raw) as AuthState;

    if (
      parsed &&
      typeof parsed === "object" &&
      "user" in parsed &&
      "token" in parsed
    ) {
      return parsed;
    }

    return { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

const initialState: AuthState = readStoredAuth();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      localStorage.setItem("dums.token", action.payload.token);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;

      if (state.token) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: action.payload, token: state.token }),
        );
      }
    },
    updatePasswordFlags(state, action: PayloadAction<boolean>) {
      if (state.user) {
        state.user.mustChangePassword = action.payload;

        if (state.token) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ user: state.user, token: state.token }),
          );
        }
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("dums.token");
    },
  },
});

export const { setCredentials, setUser, updatePasswordFlags, logout } =
  authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.token);

export const selectMustChangePassword = (state: { auth: AuthState }) =>
  state.auth.user?.mustChangePassword ?? false;
