import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    timeout: 60000,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
            console.error("Backend server is unreachable");
        }
        return Promise.reject(err);
    }
);

export default api;
