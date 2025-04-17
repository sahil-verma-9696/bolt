import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, signupUser, getMe } from "./authService";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginUser(credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await signupUser(credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data.message || "signup fail");
    }
  }
);

export const me = createAsyncThunk(
  "user/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMe();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "getMe failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    setUser: (state, action) => {
      state.user = action.payload; // Store user details in Redux
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        // state.user = action.payload.user;
        localStorage.setItem("userId", action.payload.user._id);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        // state.user = action.payload.user;
        localStorage.setItem("userId", action.payload.user._id);
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = true;
        state.error = action.payload;
      })
      .addCase(me.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(me.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(me.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
