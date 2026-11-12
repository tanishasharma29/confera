import axios from "axios";

let tokenGetter = null;

export const setClerkTokenGetter = (getter) => {
  tokenGetter = getter;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  try {
    let token = null;

    if (tokenGetter) {
      try {
        token = await tokenGetter();
      } catch (e) {
        console.warn("[API] tokenGetter failed:", e.message);
      }
    }

    if (!token && window.Clerk?.session) {
      try {
        token = await window.Clerk.session.getToken();
      } catch (e) {
        console.warn("[API] window.Clerk getToken failed:", e.message);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("[API] Error in request interceptor:", err.message);
  }
  return config;
});

export default api;
