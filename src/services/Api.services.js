import axios from "axios";

console.log('Base URL usada para API:', urlBaseMeta);

const urlBaseMeta = import.meta.env.VITE_API_URL + "/api";// Para verificar la URL en consola



export const Api = () => {
    let token = localStorage.getItem("access_token");

    const api = axios.create({
        baseURL: urlBaseMeta,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    api.interceptors.response.use(
        (response) => response, // Retordasdanar respuesta directamente
        (error) => {
            if (error.response) {
                if (error.response.status === 401) {
                    console.log("Error 401: Sesión expirada");
                    localStorage.removeItem("access_token");
                    window.location.href = "/login";
                } else {
                    console.error(`Error ${error.response.status}:`, error.response.data.message || "Error desconocido");
                }
            } else {
                console.error("Error de red o servidor no disponible.");
            }
            return Promise.reject(error);
        }
    );
    
    return api;
}
