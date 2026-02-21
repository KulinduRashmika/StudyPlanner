import axios from "axios";

/**
 * IMPORTANT BASE URL:
 * Android emulator: http://10.0.2.2:8080
 * Real phone: http://YOUR_PC_IP:8080
 * iOS simulator: http://localhost:8080
 */
export const BASE_URL = "http://192.168.1.4:8080";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});