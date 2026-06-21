import axios from "axios";

const authApi = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = (payload) => authApi.post("/login", payload);

export const registerUser = (payload) => authApi.post("/register", payload);

export const getCurrentUser = () => authApi.get("/me");

export const logoutUser = () => authApi.post("/logout");

export default authApi;
