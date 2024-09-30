import axios from 'axios'
import queryClient from './queryClient';
import { navigate } from '../lib/navigation';

const options = {
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
}

const TokenRefreshClient =axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => {
console.log("RESPONSE:", response)
   return response.data
});

const API = axios.create(options)

API.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const {config, response} = error;
        const {status, data} = response || {};

        // try to refresh the access token behind the scenes
        if(data?.errorCode === "InvalidAccessToken") {
            console.log("LOCATION 1")
            try {
                await TokenRefreshClient.get("/auth/refresh");
                console.log("LOCATION 2")
                return TokenRefreshClient(config);
            } catch (error) {
                console.log("ERROR:", error)
                queryClient.clear();
                navigate("/login", {
                    state: {
                        redirectUrl: window.location.pathname
                    }
                })
            }
        }

        return Promise.reject({status, ...data})
    }
)

export default API