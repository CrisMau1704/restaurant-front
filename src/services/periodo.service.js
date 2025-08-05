import { Api } from "./Api.services";

export default {
  // Paginación (opcional, si usas en otro lado)
  index(page = 1, limit = 10, q = "") {
    return Api().get(`/periodo?page=${page}&limit=${limit}&q=${q}`);
  },

  // Reporte de ventas por periodo y vendedor
  ventas(filtros) {
    return Api().get('/reportes/periodo', { params: filtros });
  },

  usuarios() {
    return Api().get('/usuarios/vendedores');
  }


};