import { Api } from "./Api.services";

export default {

     // Paginación
      index(page = 1, limit = 10, q = "") {
             return Api().get(`/usuario?page=${page}&limit=${limit}&q=${q}`);
         },
    

    guardarUsuario(datos) {  // Añade datos como parámetro aquí
        return Api().post("/usuario", datos);
    },

    mostrarUsuario(id) {
        return Api().get("/usuario/" + id);
    },

    modificarUsuario(id, datos) {  // Añade datos como parámetro aquí
        return Api().put("/usuario/" + id, datos);
    },

    eliminarUsuario(id) {
        return Api().delete("/usuario/" + id);
    },
};
