import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true, // optional if you use cookies or JWT in headers
});

export default api;
