import { Api } from "./Api.services";

export default {
    // Obtener usuarios con roles
    getUsersWithRoles() {
        return Api().get('/users-with-roles');
    },
    // Obtener todos los roles
    getAllRoles() {
        return Api().get('/roles');
    },
    // Asignar roles a un usuario
    assignUserRoles(userId, roles) {
        return Api().post('/assign-roles', { user_id: userId, roles });
    }
    
}
