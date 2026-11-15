import { create } from "axios";

const apiClient = create({
  baseURL:
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://172.22.36.53:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
