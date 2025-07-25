import { Api } from "./Api.services";

export default {
    // Paginación
    index(page = 1, limit = 10, q = "") {
        return Api().get(`/pedido?page=${page}&limit=${limit}&q=${q}`);
    },


    // Crear nuevo pedido
    store(datos) {
        const fecha = new Date().toISOString(); 
        
        const datosConFecha = {
            ...datos,
            fecha: fecha,
        };
    
        return Api().post("/pedido", datosConFecha);
    },
    

    // Obtener un pedido por ID
    show(id) {
        return Api().get("/pedido/" + id);
    },

    // Actualizar un pedido existente
    update(id, datos) {  // Recibe los datos actualizados del pedido
        return Api().put("/pedido/" + id, datos);
    },

    // Obtener el estado de un pedido (si es necesario, dependiendo de tu API)
    status(id) {
        return Api().get(`/pedido/status/${id}`);
    },

    // Agregar otros métodos si es necesario
};