import { configureStore, createSlice } from "@reduxjs/toolkit";

const savedAuth = (() => {
  try {
    return JSON.parse(localStorage.getItem("galliscore.auth") || "{}");
  } catch {
    return {};
  }
})();

const savedTheme = localStorage.getItem("galliscore.theme") || "system";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedAuth.user || null,
    token: savedAuth.token || "",
    refreshToken: savedAuth.refreshToken || "",
  },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("galliscore.auth", JSON.stringify(action.payload));
    },
    clearCredentials(state) {
      state.user = null;
      state.token = "";
      state.refreshToken = "";
      localStorage.removeItem("galliscore.auth");
    },
  },
});

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: savedTheme,
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem("galliscore.theme", action.payload);
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const { setTheme } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});
