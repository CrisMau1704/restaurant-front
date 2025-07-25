import { Api } from "./Api.services";

export default {
    login: (credenciales) => {
        return Api().post('/v1/auth/login', credenciales)
            .then(response => {
                // Guarda el token y el rol en localStorage
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('usuario_rol', response.data.rol);  // Guardando el rol
                console.log('Token y rol guardados:', response.data.access_token, response.data.rol);  // Log para verificar
                return response;
            })
            .catch(error => {
                console.error('Error al hacer login:', error);
            });
    },
    
    
    registro: () => {
        // Implementa la lógica de registro aquí
    },
    perfil: () => {
        // Implementa la lógica para obtener el perfil del usuario aquí
    },
    salir: () => {
        // Lógica para salir (logout)
        localStorage.removeItem('access_token');
        localStorage.removeItem('usuario_rol');
    },
    getUserRole: () => {
        // Asegúrate de que el rol del usuario esté guardado en localStorage
        return localStorage.getItem('usuario_rol');  // Devuelve el rol del usuario
    }
}
