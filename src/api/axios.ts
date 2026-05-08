import axios from "axios";

const api = axios.create({
    baseURL: "https://localhost:7251/api",
});

api.interceptors.request.use(config => {
    // Check localStorage first, then sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;