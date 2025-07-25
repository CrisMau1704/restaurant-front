import { Api } from "./Api.services";

export default {

     // Paginación
    index(page = 1, limit = 10, q = "", fi="" ,ff="") {
        return Api().get(`/compra?page=${page}&limit=${limit}&q=${q}`);
    },
    
    //store
    store(datos) {  // Añade datos como parámetro aquí
        return Api().post("/compra", datos);
    },
    //show
    show(id) {
        return Api().get("/compra/" + id);
    },
    //update
    update(id, datos) {  // Añade datos como parámetro aquí
        return Api().put("/compra/" + id, datos);
    },
    
};
