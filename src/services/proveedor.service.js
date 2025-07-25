import { Api } from "./Api.services";

export default {

     // Paginación
     index(page = 1, limit = 10, q = "") {
        return Api().get(`/proveedor?page=${page}&limit=${limit}&q=${q}`);
    },
    
    //store
    store(datos) {  // Añade datos como parámetro aquí
        return Api().post("/proveedor", datos);
    },
    //show
    show(id) {
        return Api().get("/proveedor/" + id);
    },
    //update
    update(id, datos) {  // Añade datos como parámetro aquí
        return Api().put("/proveedor/" + id, datos);
    },
    //destroy
    destroy(id) {
        return Api().delete("/proveedor/" + id);
    },

    buscarProveedor(q=""){
        return Api().get(`/proveedor/buscar-proveedor?q=${q}`)
    }
};
