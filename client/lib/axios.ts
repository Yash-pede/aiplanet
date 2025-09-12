import axios from "axios";
import { createClient } from "./supabase/client";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  // console.log(accessToken);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const supabase = createClient();
      console.log("401 error UNAUTHORIZED");
      await supabase.auth.signOut();
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;
