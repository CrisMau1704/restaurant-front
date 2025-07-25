import { Api } from "./Api.services";

export default {
    // Este es el nuevo método que necesitas
    getAll() {
        return Api().get("/categoria");
    },

    index(page = 1, limit = 10, q = "") {
        return Api().get(`/categoria?page=${page}&limit=${limit}&q=${q}`);
    },

    store(datos) {
        return Api().post("/categoria", datos);
    },

    show(id) {
        return Api().get(`/categoria/${id}`);
    },

    update(id, datos) {
        return Api().put("/categoria/" + id, datos);
    },

    destroy(id) {
        return Api().delete("/categoria/" + id);
    },
};
