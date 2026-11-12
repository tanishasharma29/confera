import axios from "axios";

let tokenGetter = null;
let currentUserId = null;

export const setClerkTokenGetter = (getter) => {
  tokenGetter = getter;
};

export const setClerkUserId = (id) => {
  currentUserId = id;
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

    const effectiveUserId = currentUserId || window.Clerk?.user?.id;
    if (effectiveUserId) {
      config.headers["x-user-id"] = effectiveUserId;
    }
  } catch (err) {
    console.warn("[API] Error in request interceptor:", err.message);
  }
  return config;
});

export default api;
