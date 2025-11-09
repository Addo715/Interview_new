
// client/src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  // REMOVED withCredentials to fix CORS error
});

export default api;