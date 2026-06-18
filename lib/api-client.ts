import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach access token + X-Partner-Id (for member partner-context switching)
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  const userType = Cookies.get("ec_user_type");
  if (userType === "MEMBER") {
    const activePartnerId = Cookies.get("ec_active_partner");
    if (activePartnerId) {
      config.headers["X-Partner-Id"] = activePartnerId;
    }
  }
  return config;
});

// Handle 401 → refresh → retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(error);
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(apiClient(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = Cookies.get("ec_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` }, withCredentials: true }
        );
        const newToken: string = res.data?.data?.access_token;
        const newRefresh: string | undefined = res.data?.data?.refresh_token;

        setAccessToken(newToken);
        if (newRefresh) {
          Cookies.set("ec_refresh_token", newRefresh, { expires: 1, sameSite: "strict" });
        }

        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      } catch {
        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];
        setAccessToken(null);
        Cookies.remove("ec_refresh_token");
        Cookies.remove("ec_user_type");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
