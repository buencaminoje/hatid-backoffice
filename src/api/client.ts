import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const DEVICE_ID_KEY = "hatid_admin_device_id";
const ACCESS_TOKEN_KEY = "hatid_admin_access_token";
const REFRESH_TOKEN_KEY = "hatid_admin_refresh_token";
const USER_KEY = "hatid_admin_user";

function getDeviceId() {
  let deviceId = localStorage.getItem(
      DEVICE_ID_KEY
  );

  if (!deviceId) {
    deviceId = crypto.randomUUID();

    localStorage.setItem(
        DEVICE_ID_KEY,
        deviceId
    );
  }

  return deviceId;
}

export const tokenStorage = {
  getAccessToken: () =>
      localStorage.getItem(
          ACCESS_TOKEN_KEY
      ),

  setAccessToken: (token: string) =>
      localStorage.setItem(
          ACCESS_TOKEN_KEY,
          token
      ),

  getRefreshToken: () =>
      localStorage.getItem(
          REFRESH_TOKEN_KEY
      ),

  setRefreshToken: (token: string) =>
      localStorage.setItem(
          REFRESH_TOKEN_KEY,
          token
      ),

  clear: () => {
    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        REFRESH_TOKEN_KEY
    );
  },
};

export const userStorage = {
  get: <T = any>(): T | null => {
    const value = localStorage.getItem(
        USER_KEY
    );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  set: (user: unknown) =>
      localStorage.setItem(
          USER_KEY,
          JSON.stringify(user)
      ),

  clear: () =>
      localStorage.removeItem(USER_KEY),
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(
    (
        config: InternalAxiosRequestConfig
    ) => {
      config.headers["X-Did-id"] =
          getDeviceId();

      config.headers["X-Trace-id"] =
          crypto.randomUUID();

      const token =
          tokenStorage.getAccessToken();

      if (token) {
        config.headers.Authorization =
            `Bearer ${token}`;
      }

      return config;
    }
);

apiClient.interceptors.response.use(
    (response) => response,

    (error: AxiosError) => {
      if (error.response?.status === 401) {
        tokenStorage.clear();
        userStorage.clear();

        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
);