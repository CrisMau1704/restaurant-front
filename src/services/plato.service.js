import { Api } from "./Api.services";

export default {
    // Paginación de platos
    async index(page = 1, limit = 10, q = "") {
        try {
            const response = await Api().get(`/plato?page=${page}&limit=${limit}&q=${q}`);
            return response;
        } catch (error) {
            console.error('Error al obtener los platos:', error);
            throw error; // Propagar el error para que se pueda manejar más arriba
        }
    },

    // Crear un nuevo plato
    async store(datos) {
        try {
            const productosIds = Array.isArray(datos.productos)
                ? datos.productos.map(p => p.id || p)  // <- Acepta IDs directos o objetos
                : [];

            const datosParaEnviar = {
                nombre: datos.nombre,
                precio_venta: datos.precio_venta,
                categoria_id: datos.categoria_id,
                productos: productosIds
            };

            const response = await Api().post("/plato", datosParaEnviar);
            return response;
        } catch (error) {
            console.error('Error al crear el plato:', error.response?.data || error);
            throw error;
        }
    },

    // Obtener un plato específico por ID
    async show(id) {
        if (!id) {
            throw new Error("El ID es requerido");
        }
        try {
            const response = await Api().get(`/plato/${id}`);
            return response;
        } catch (error) {
            console.error('Error al obtener el plato:', error);
            throw error;
        }
    },

    // Actualizar un plato existente
    async update(id, datos) {
        if (!id) throw new Error("El ID es requerido");

        try {
            const productosIds = Array.isArray(datos.productos)
                ? datos.productos.map(p => p.id || p)
                : [];

            const datosActualizados = {
                nombre: datos.nombre,
                precio_venta: datos.precio_venta,
                categoria_id: datos.categoria_id, // <- Asegúrate de incluir esto
                productos: productosIds
            };

            const response = await Api().put(`/plato/${id}`, datosActualizados);
            return response;
        } catch (error) {
            console.error('Error al actualizar plato:', error);
            throw error;
        }
    },

    // Eliminar un plato
    async destroy(id) {
        if (!id) throw new Error("El ID es requerido");
        try {
            const response = await Api().delete(`/plato/${id}`);
            console.log('Plato eliminado correctamente:', response);
            return response;
        } catch (error) {
            console.error('Error al eliminar el plato:', error);
            throw error;
        }
    },

    // Buscar platos por nombre u otros filtros
    async buscarPlato(q = "") {
        try {
            const response = await Api().get(`/plato/buscar-plato?q=${q}`);
            return response;
        } catch (error) {
            console.error('Error al buscar los platos:', error);
            throw error;
        }
    },

    // Obtener categorías
    async getCategorias() {
        try {
            const response = await Api().get("/categoria");
            return response;
        } catch (error) {
            console.error("Error al obtener las categorías:", error);
            throw error;
        }
    },

    // Obtener productos asociados a un plato
    async getProductosPorPlato(platoId) {
        try {
            const response = await Api().get(`/platos/${platoId}/productos`);
            return response.data; // Devuelve los productos asociados al plato
        } catch (error) {
            console.error("Error al obtener los productos por plato:", error);
            throw error;
        }
    },

   async getByCategoria(categoriaId) {
  if (!categoriaId) throw new Error("El ID de categoría es requerido");
  try {
    const response = await Api().get(`/plato/categoria/${categoriaId}`);
    return response; // Retorna todo el objeto response
  } catch (error) {
    console.error("Error al obtener platos por categoría:", error);
    throw error;
  }
}



    
    
};
