<template>
    <div class="pedido-container">
        <!-- Mostrar Categorías -->
        <div v-if="!categoriaSeleccionada">
            <h2>Selecciona una Categoría</h2>
            <div class="categorias-grid">
                <div v-for="cat in categorias" :key="cat.id" class="categoria-card" @click="seleccionarCategoria(cat)">
                    <i class="pi pi-folder"></i>
                    <p>{{ cat.nombre }}</p>
                </div>
            </div>
        </div>

        <!-- Mostrar Platos de la Categoría Seleccionada -->
        <div v-else>
            <Button icon="pi pi-arrow-left" label="Volver" @click="volverACategorias" class="mb-3" />
            <h2>Platos en {{ categoriaSeleccionada?.nombre || '' }}</h2>

            <div class="platos-grid">
                <div v-for="plato in platos" :key="plato.id" class="plato-card" @click="addCarrito(plato)">
                    <img :src="`http://127.0.0.1:8000/storage/${plato.imagen}`" :alt="plato.nombre" />
                    <h4>{{ plato.nombre }}</h4>
                    <p>{{ formatCurrency(plato.precio_venta) }}</p>
                </div>
            </div>
        </div>

        <!-- Carrito -->
        <div class="carrito-section" v-if="carrito.length > 0">
            <h3>Carrito ({{ carrito.length }} items)</h3>
            <div class="carrito-items">
                <div v-for="item in carrito" :key="item.plato_id" class="carrito-item">
                    <img class="carrito-img" :src="`http://127.0.0.1:8000/storage/${getImagenPlato(item.plato_id)}`"
                        alt="Imagen Plato" />
                    <div class="carrito-info">
                        <h4>{{ item.nombre }}</h4>
                        <div class="cantidad-control">
                            <button @click="disminuirCantidad(item)">-</button>
                            <span>{{ item.cantidad }}</span>
                            <button @click="aumentarCantidad(item)">+</button>
                        </div>
                        <p>Subtotal: {{ formatCurrency(item.precio_venta * item.cantidad) }}</p>
                    </div>
                    <button class="btn-eliminar" @click="eliminarItem(item)">✕</button>
                </div>
            </div>
            <div class="total">Total: {{ formatCurrency(montoTotal) }}</div>

            <!-- Botón Pagar -->
            <div class="pagar-container">
                <Button label="Pagar" icon="pi pi-credit-card" class="p-button-success"
                    @click="mostrarModalPago = true" />
            </div>
        </div>

        <!-- Modal Pago -->
        <Dialog header="Procesar Pago" :visible="mostrarModalPago" style="width: 450px" modal closable
            @hide="resetModal">
            <div class="modal-content">
                <h3>Total a Pagar: {{ formatCurrency(montoTotal) }}</h3>

                <!-- Buscar cliente -->
                <label for="buscarCliente">Buscar Cliente:</label>
                <InputText id="buscarCliente" v-model="busquedaCliente" @input="buscarCliente"
                    placeholder="Escribe nombre o CI..." autocomplete="off" />

                <!-- Mostrar datos cliente si existe -->
                <div class="customer-details" v-if="clienteSeleccionado && clienteSeleccionado.id">
                    <div class="customer-info">
                        <div class="info-item">
                            <span class="info-label">Nombre:</span>
                            <span class="info-value">{{ clienteSeleccionado.nombre_completo }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">CI/NIT:</span>
                            <span class="info-value">{{ clienteSeleccionado.ci_nit }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">{{ clienteSeleccionado.telefono }}</span>
                        </div>
                    </div>
                </div>

                <div v-else-if="busquedaCliente.length > 2 && !clienteSeleccionado">
                    <small>No se encontró cliente.</small>
                </div>

                <!-- Selección método de pago -->
                <label for="metodoPago">Método de Pago:</label>
                <Dropdown id="metodoPago" :options="metodosPago" optionLabel="label" v-model="metodoPagoSeleccionado"
                    placeholder="Selecciona un método" @change="onMetodoPagoChange" />

                <!-- Si es efectivo, mostrar input para monto entregado y calcular cambio -->
                <div v-if="metodoPagoSeleccionado && metodoPagoSeleccionado.value === 'efectivo'"
                    class="efectivo-section">
                    <label for="montoEntregado">Monto entregado:</label>
                    <InputText id="montoEntregado" v-model.number="montoEntregado" type="number" min="0"
                        @input="calcularCambio" />
                    <p>Cambio: {{ formatCurrency(cambio) }}</p>
                </div>

                <Button label="Confirmar Pago" icon="pi pi-check" class="p-button-primary" :disabled="!puedePagar"
                    @click="confirmarPago" />
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";

import categoriaService from "@/services/categoria.service";
import platoService from "@/services/plato.service";
import clienteService from "@/services/cliente.service";

const categorias = ref([]);
const platos = ref([]);
const categoriaSeleccionada = ref(null);
const carrito = ref([]);

// Aquí la variable unificada para la búsqueda del cliente
const busquedaCliente = ref('');
const clienteSeleccionado = ref(null);

// Variables para modal pago
const mostrarModalPago = ref(false);
const metodoPagoSeleccionado = ref(null);
const metodosPago = [
    { label: "Efectivo", value: "efectivo" },
    { label: "QR", value: "qr" },
    { label: "Tarjeta", value: "tarjeta" },
];
const montoEntregado = ref(0);
const cambio = ref(0);

// Carga las categorías al montar
onMounted(async () => {
    try {
        const { data } = await categoriaService.getAll();
        categorias.value = Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
});

// Selecciona categoría y carga platos
const seleccionarCategoria = async (cat) => {
    if (!cat || !cat.id) return;
    categoriaSeleccionada.value = cat;
    try {
        const { data } = await platoService.getByCategoria(cat.id);
        platos.value = Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.error("Error cargando platos:", error);
        platos.value = [];
    }
};

// Volver a mostrar categorías
const volverACategorias = () => {
    categoriaSeleccionada.value = null;
    platos.value = [];
};

// Añadir plato al carrito
const addCarrito = (plato) => {
    const existente = carrito.value.find((p) => p.plato_id === plato.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.value.push({
            plato_id: plato.id,
            nombre: plato.nombre,
            precio_venta: plato.precio_venta,
            cantidad: 1,
        });
    }
};

// Funciones para aumentar/disminuir cantidad y eliminar
const aumentarCantidad = (item) => {
    item.cantidad++;
};

const disminuirCantidad = (item) => {
    if (item.cantidad > 1) {
        item.cantidad--;
    } else {
        eliminarItem(item);
    }
};

const eliminarItem = (item) => {
    const index = carrito.value.findIndex((p) => p.plato_id === item.plato_id);
    if (index !== -1) {
        carrito.value.splice(index, 1);
    }
};

// Obtener imagen del plato para mostrar en carrito
const getImagenPlato = (platoId) => {
    const plato = platos.value.find((p) => p.id === platoId);
    return plato ? plato.imagen : "placeholder.png";
};

// Total a pagar
const montoTotal = computed(() =>
    carrito.value.reduce((acc, item) => acc + item.precio_venta * item.cantidad, 0)
);

// Formatear moneda
const formatCurrency = (value) =>
    value
        ? value.toLocaleString("es-BO", { style: "currency", currency: "BOB" })
        : "";

// Función para buscar cliente
const buscarCliente = async () => {
    if (busquedaCliente.value.length < 3) {
        clienteSeleccionado.value = null;
        return;
    }
    try {
        const { data } = await clienteService.buscarCliente(busquedaCliente.value);
        if (Array.isArray(data) && data.length > 0) {
            clienteSeleccionado.value = data[0];
        } else if (data && data.id) {
            clienteSeleccionado.value = data;
        } else {
            clienteSeleccionado.value = null;
        }
    } catch (error) {
        console.error("Error buscando cliente:", error);
        clienteSeleccionado.value = null;
    }
};

// Cambiar método de pago
const onMetodoPagoChange = () => {
    montoEntregado.value = 0;
    cambio.value = 0;
};

// Calcular cambio
const calcularCambio = () => {
    cambio.value = montoEntregado.value - montoTotal.value;
    if (cambio.value < 0) cambio.value = 0;
};

// Reset modal al cerrar
const resetModal = () => {
    mostrarModalPago.value = false;
    busquedaCliente.value = "";
    clienteSeleccionado.value = null;
    metodoPagoSeleccionado.value = null;
    montoEntregado.value = 0;
    cambio.value = 0;
};

// Validación para activar botón pagar
const puedePagar = computed(() => {
    if (!clienteSeleccionado.value) return false;
    if (!metodoPagoSeleccionado.value) return false;
    if (metodoPagoSeleccionado.value.value === "efectivo" && montoEntregado.value < montoTotal.value) return false;
    return true;
});

// Confirmar pago (ajusta esta función con lógica real)
const confirmarPago = () => {
    alert(`Pago confirmado por ${formatCurrency(montoTotal.value)} con método ${metodoPagoSeleccionado.value.label}.`);
    // Aquí enviar al backend, limpiar carrito, cerrar modal, etc.
    carrito.value = [];
    resetModal();
};
</script>




<style scoped>
.pedido-container {
    padding: 1rem;
}

/* Grid para categorías y platos */
.categorias-grid,
.platos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
}

/* Tarjetas categorías y platos */
.categoria-card,
.plato-card {
    background: #f4f4f4;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: 0.3s;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.categoria-card:hover,
.plato-card:hover {
    background: #e0f7fa;
}

/* Icono categoría */
.categoria-card i {
    font-size: 3.5rem;
    color: #3498db;
    margin-bottom: 1rem;
}

/* Texto categoría */
.categoria-card p {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
}

/* Imagen platos - tamaño limitado para que no se vean grandes */
.plato-card img {
    max-width: 120px;
    max-height: 100px;
    object-fit: contain;
    margin-bottom: 0.8rem;
    border-radius: 6px;
    transition: transform 0.3s;
}

.plato-card:hover img {
    transform: scale(1.05);
}

/* Texto platos */
.plato-card h4 {
    font-size: 1.1rem;
    margin: 0.3rem 0 0.5rem;
}

.plato-card p {
    font-weight: 600;
    color: #2c3e50;
}

/* Estilos carrito */
.carrito-section {
    margin-top: 2rem;
    background: #f9f9f9;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.12);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Lista de items en carrito con scroll */
.carrito-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 320px;
    overflow-y: auto;
    padding-right: 8px;
    /* espacio para scrollbar */
}

/* Item del carrito */
.carrito-item {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 8px;
    padding: 0.7rem 1rem;
    box-shadow: 0 0 6px rgb(0 0 0 / 0.08);
}

/* Imagen en carrito */
.carrito-img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 1rem;
    border: 1px solid #ccc;
    flex-shrink: 0;
}

/* Info item carrito */
.carrito-info {
    flex-grow: 1;
}

.carrito-info h4 {
    margin: 0 0 0.4rem 0;
    font-weight: 700;
    font-size: 1.1rem;
}

/* Control cantidad en carrito */
.cantidad-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
}

.cantidad-control button {
    width: 30px;
    height: 30px;
    border: none;
    background-color: #3498db;
    color: white;
    font-weight: bold;
    font-size: 20px;
    border-radius: 5px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
}

.cantidad-control button:hover {
    background-color: #1c6ea4;
}

.cantidad-control span {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
}

/* Botón eliminar */
.btn-eliminar {
    background: transparent;
    border: none;
    font-size: 24px;
    color: #e74c3c;
    cursor: pointer;
    padding: 0 0.5rem;
    user-select: none;
    transition: color 0.2s;
}

.btn-eliminar:hover {
    color: #c0392b;
}

/* Total a pagar */
.total {
    font-weight: 700;
    font-size: 1.5rem;
    margin-top: 1.2rem;
    text-align: right;
    color: #2c3e50;
}

/* Contenedor botón pagar */
.pagar-container {
    margin-top: 1.5rem;
    text-align: right;
}

/* Modal contenido */
.modal-content label {
    display: block;
    margin-top: 1rem;
    margin-bottom: 0.3rem;
    font-weight: 600;
}

.cliente-info p {
    margin: 0.2rem 0;
}

.efectivo-section input {
    width: 100%;
    padding: 0.4rem;
    font-size: 1rem;
}
</style>
