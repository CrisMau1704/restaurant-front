import { Api } from "./Api.services";

export default {
    // Paginación de tareas
    index(page = 1, limit = 10, q = "") {
        // Incluye los parámetros de paginación y búsqueda
        return Api().get("/tarea", {
            params: { page, limit, q }
        });
    },
    // Crear nueva tarea
    store(datos) {
        // Asegúrate de que el estado sea una cadena antes de enviar
        if (datos.estado && typeof datos.estado !== 'string') {
            datos.estado = String(datos.estado);  // Convierte el estado a string
        }
    
        return Api().post("/tarea", datos);
    }
    ,

    // Obtener tarea específica por ID
    show(id) {
        return Api().get("/tarea/" + id);
    },

    // Actualizar tarea
    update(id, datos) {
        return Api().put("/tarea/" + id, datos);
    },

    // Eliminar tarea
    destroy(id) {
        return Api().delete("/tarea/" + id);
    },

    // Buscar tareas por texto
    buscarTarea(q = "") {
        return Api().get(`/tarea/buscar-tarea?q=${q}`);
    },

    // Obtener todas las áreas
    cargarAreas() {
        return Api().get("/area");  // Ruta para obtener todas las áreas
    },
};
