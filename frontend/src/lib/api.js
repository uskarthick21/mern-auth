import API from "../config/apiClient";

export const login = async (data) => API.post("/auth/login", data);

export const register = async (data) => API.post("/auth/register", data);

export const verifyEmail = async (verificationCode) =>
    API.get(`/auth/email/verify/${verificationCode}`);