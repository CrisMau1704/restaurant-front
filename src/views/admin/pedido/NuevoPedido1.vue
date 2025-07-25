<template>
    <div class="restaurant-container">
        <!-- Header con título y posible logo
        <div class="header-section">
            <h1 class="restaurant-title">🍽️ Nuevo Pedido</h1>
        </div> -->

        <div class="main-layout">
            <!-- Sección de Platos -->
            <div class="menu-section">
                <div class="menu-card">
                    <div class="card-header">
                        <h2>Menú del Restaurante</h2>
                        <span class="p-input-icon-left search-box">
                            <i class="pi pi-search"></i>
                            <InputText placeholder="Buscar platos..." v-model="buscar" @keypress.enter="getPlatos" />
                        </span>
                    </div>

                    <DataTable ref="dt" :value="platos" dataKey="id" lazy :totalRecords="totalRecords"
                        :loading="loading" :paginator="true" :rows="rows" @page="onPage"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[6, 12, 24]"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} platos"
                        class="menu-table">

                        <Column field="nombre" header="NOMBRE" sortable style="min-width:16rem"></Column>
                        <Column field="categoria.nombre" header="Categoría" sortable style="min-width:8rem"></Column>

                        <!-- Columna de Imagen mejorada -->
                        <Column header="Imagen" style="width: 120px">
                            <template #body="slotProps">
                                <div class="dish-image-container" @click="addCarrito(slotProps.data)">
                                    <img :src="`http://127.0.0.1:8000/storage/${slotProps.data.imagen}`"
                                        :alt="slotProps.data.nombre" class="dish-image" />
                                    <div class="add-to-cart-hover">
                                        <i class="pi pi-plus-circle"></i> Añadir
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="precio_venta" header="Precio" sortable style="min-width:8rem">
                            <template #body="slotProps">
                                <span class="price-tag">{{ formatCurrency(slotProps.data.precio_venta) }}</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Sección del Carrito (ahora al lado derecho) -->
            <div class="order-section">
                <div class="order-card">
                    <h3 class="order-title">Tu Pedido
                        <span class="item-count" v-if="carrito.length > 0">({{carrito.reduce((acc, item) => acc +
                            item.cantidad, 0)
                            }} items)</span>
                    </h3>

                    <div class="order-items" v-if="carrito.length > 0">
                        <DataTable :value="carrito" class="cart-table">
                            <Column field="nombre" header="Plato">
                                <template #body="slotProps">
                                    <div class="cart-item-name">{{ slotProps.data.nombre }}</div>
                                </template>
                            </Column>
                            <Column field="precio_venta" header="Precio">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.precio_venta) }}
                                </template>
                            </Column>
                            <Column field="cantidad" header="Cant">
                                <template #body="slotProps">
                                    <div class="quantity-controls">
                                        <Button icon="pi pi-minus" rounded severity="warning"
                                            @click="reducirCantidad(slotProps.data)" class="qty-btn" />
                                        <span class="qty-value">{{ slotProps.data.cantidad }}</span>
                                        <Button icon="pi pi-plus" rounded severity="info"
                                            @click="aumentarCantidad(slotProps.data)" class="qty-btn" />
                                    </div>
                                </template>
                            </Column>
                            <!-- Nueva columna para el subtotal -->
                            <Column header="Subtotal">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.precio_venta * slotProps.data.cantidad) }}
                                </template>
                            </Column>
                            <Column :exportable="false" style="width: 80px">
                                <template #body="slotProps">
                                    <Button icon="pi pi-trash" rounded severity="danger"
                                        @click="quitarCarrito(slotProps.data)" class="remove-btn" />
                                </template>
                            </Column>
                        </DataTable>

                        <!-- Total -->
                        <div class="order-total">
                            <div class="total-label">Total a Pagar:</div>
                            <div class="total-amount">{{ formatCurrency(montoTotal) }}</div>
                        </div>
                    </div>

                    <div class="empty-cart" v-else>
                        <i class="pi pi-shopping-cart"></i>
                        <p>Tu carrito está vacío</p>
                        <small>Haz clic en las imágenes del menú para agregar platos</small>
                    </div>
                </div>

                <!-- Sección del Cliente -->
                <div class="customer-card">
                    <div class="customer-header">
                        <h3>Datos del Cliente</h3>
                        <Button icon="pi pi-user-plus" label="Nuevo" rounded severity="success"
                            @click="visible = true" />
                    </div>

                    <div class="customer-search">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText placeholder="Buscar por CI/NIT..." v-model="buscar_cliente"
                                @keypress.enter="busquedaCliente" />
                        </span>
                    </div>

                    <div class="customer-details" v-if="cliente_seleccionado && cliente_seleccionado.id">
                        <div class="customer-info">
                            <div class="info-item">
                                <span class="info-label">Nombre:</span>
                                <span class="info-value">{{ cliente_seleccionado.nombre_completo }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">CI/NIT:</span>
                                <span class="info-value">{{ cliente_seleccionado.ci_nit }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span>
                                <span class="info-value">{{ cliente_seleccionado.telefono }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="no-customer" v-else>
                        <i class="pi pi-info-circle"></i>
                        <p>Seleccione o registre un cliente</p>
                    </div>
                </div>

                <!-- Finalizar Pedido -->
                <div class="checkout-card">
                    <h3>Finalizar Pedido</h3>

                    <Button label="Confirmar Pedido" icon="pi pi-check" @click="guardarPedido" class="confirm-btn"
                        :disabled="carrito.length === 0 || !cliente_seleccionado.id" />
                </div>
            </div>
        </div>

        <Toast ref="toast" />

        <!-- Dialog para crear nuevo cliente -->
        <Dialog v-model:visible="visible" maximizable modal header="Registrar Nuevo Cliente"
            class="p-fluid customer-dialog" :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <div class="field">
                <label for="name">Nombre Completo</label>
                <InputText id="name" v-model.trim="cliente.nombre_completo" required="true" autofocus
                    :invalid="submitted && !cliente.nombre_completo" />
                <small class="p-error" v-if="submitted && !cliente.nombre_completo">Nombre es obligatorio.</small>
            </div>
            <div class="field">
                <label for="ci_nit">CI/NIT</label>
                <InputText id="ci_nit" v-model.trim="cliente.ci_nit" required="true" autofocus
                    :invalid="submitted && !cliente.ci_nit" />
                <small class="p-error" v-if="submitted && !cliente.ci_nit">CI/NIT es obligatorio.</small>
            </div>
            <div class="field">
                <label for="tel">Teléfono</label>
                <InputText id="tel" v-model.trim="cliente.telefono" autofocus />
            </div>
            <template #footer>
                <Button label="Guardar Cliente" icon="pi pi-check" @click="guardarCliente" autofocus
                    class="save-customer-btn" />
            </template>
        </Dialog>
    </div>
</template>


<script setup>
import clienteService from '../../../services/cliente.service';
import pedidoService from '../../../services/pedido.service';
import platoService from '../../../services/plato.service';
import productoService from '../../../services/producto.service';
import Toast from 'primevue/toast';
import { ref, computed, onMounted } from 'vue';

const platos = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: rows.value });
const buscar = ref('');
const buscar_cliente = ref('');
const cliente_seleccionado = ref({});
const carrito = ref([]);
const observaciones = ref('');
const toast = ref(null);
const cliente = ref({});
const visible = ref(false);
const submitted = ref(false);

const montoTotal = computed(() => {
    return carrito.value.reduce((total, item) => total + (item.precio_venta * item.cantidad), 0);
});

onMounted(() => {
    getPlatos();
});

const getPlatos = async () => {
    loading.value = true;
    try {
        const page = lazyParams.value.page + 1;
        const limit = lazyParams.value.rows;
        const { data } = await platoService.index(page, limit, buscar.value);
        platos.value = data.data;
        totalRecords.value = data.total;
    } catch (error) {
        console.error('Error al obtener platos:', error);
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value) => {
    return value ? value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) : '';
};

const onPage = (event) => {
    lazyParams.value.page = event.page;
    lazyParams.value.rows = event.rows;
    getPlatos();
};

const addCarrito = (plato) => {
    const platoExistente = carrito.value.find(p => p.plato_id === plato.id);
    if (platoExistente) {
        platoExistente.cantidad++;
    } else {
        carrito.value.push({
            plato_id: plato.id,
            nombre: plato.nombre,
            precio_venta: plato.precio_venta,  // Asegúrate de que 'precio_venta' se incluya
            cantidad: 1
        });
    }
};
const verificarStockPlato = async (platoId) => {
    try {
        const { data } = await axios.get(`/api/productos/${platoId}/verificar-stock`);
        return data.tieneStock;
    } catch (error) {
        console.error('Error al verificar stock:', error);
        return false;
    }
};



const quitarCarrito = (plato) => {
    const index = carrito.value.findIndex(p => p.id === plato.id);
    if (index !== -1) carrito.value.splice(index, 1);
};

const aumentarCantidad = (plato) => {
    plato.cantidad++;
};

const reducirCantidad = (plato) => {
    if (plato.cantidad > 1) {
        plato.cantidad--;
    }
};



const busquedaCliente = async () => {
    const { data } = await clienteService.buscarCliente(buscar_cliente.value);
    cliente_seleccionado.value = data;
};

const guardarCliente = async () => {
    submitted.value = true;
    if (!cliente.value.nombre_completo || !cliente.value.ci_nit) {
        return;
    }
    try {
        const response = await clienteService.store(cliente.value);
        toast.value.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cliente guardado exitosamente',
            life: 3000
        });
        visible.value = false;
    } catch (error) {
        toast.value.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un error al guardar el cliente',
            life: 3000
        });
    }
};


const guardarPedido = async () => {
    // Validación del cliente seleccionado
    if (!cliente_seleccionado.value.id) {
        toast.value.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Debe seleccionar un cliente antes de registrar el pedido',
            life: 3000
        });
        return;
    }

    // Validación de platos inválidos
    const platosInvalidos = carrito.value.filter(plato => !plato.precio_venta);
    if (platosInvalidos.length > 0) {
        toast.value.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: `El plato ${platosInvalidos[0].plato_id} no tiene precio definido.`,
            life: 3000
        });
        return;
    }

    // Crear el objeto del pedido
    let pedido = {
        cliente_id: cliente_seleccionado.value.id,
        estado: 1,
        platos: carrito.value.map(p => ({
            plato_id: p.plato_id || p.id, // Asegura que mandes el ID correcto
            cantidad: p.cantidad,
            precio_venta: p.precio_venta
        })),
        observaciones: observaciones.value,
        monto_total: montoTotal.value,
        metodo_pago: montoTotal.value,
    };

    try {
        // Registrar el pedido en el backend
        await pedidoService.store(pedido);

        toast.value.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido registrado correctamente',
            life: 3000
        });

        // Limpiar carrito y observaciones después de registrar el pedido
        carrito.value = [];
        observaciones.value = '';
    } catch (error) {
        toast.value.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al registrar el pedido',
            life: 3000
        });
        console.error('Error al guardar pedido:', error);
    }
};






</script>
<style scoped>
/* Estilos generales */
.restaurant-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    padding: 1rem;
    background-color: #f8f9fa;
    height: 100vh;
}

.header-section {
    margin-bottom: 1.5rem;
    text-align: center;
}

.restaurant-title {
    color: #2c3e50;
    font-weight: 700;
    font-size: 2rem;
    margin-bottom: 0;
}

/* Nuevo layout principal */
.main-layout {
    display: flex;
    gap: 1.5rem;
    height: calc(100vh - 100px);
}

.menu-section {
    flex: 7;
    overflow-y: auto;
}

.order-section {
    flex: 5;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
    max-height: 90%;
}

/* Tarjeta del Menú */
.menu-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    height: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.card-header h2 {
    margin: 0;
    color: #34495e;
    font-size: 1.5rem;
}

.search-box {
    width: 250px;
}

/* Estilos para las imágenes de los platos */
.dish-image-container {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dish-image-container:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.dish-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.3s ease;
}

.dish-image-container:hover .dish-image {
    opacity: 0.8;
}

.add-to-cart-hover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(46, 204, 113, 0.8);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-weight: bold;
    font-size: 0.9rem;
}

.dish-image-container:hover .add-to-cart-hover {
    opacity: 1;
}

.price-tag {
    background-color: #2ecc71;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
}

/* Estilos para la sección del pedido */
.order-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    flex-grow: 1;
}

.order-title {
    color: #34495e;
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.item-count {
    background: #3498db;
    color: white;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    margin-left: 0.5rem;
}

.empty-cart {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.empty-cart i {
    font-size: 3rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
}

.empty-cart p {
    margin: 0.5rem 0;
    font-weight: 500;
}

.empty-cart small {
    font-size: 0.8rem;
}

.order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px dashed #ddd;
}

.total-label {
    font-weight: bold;
    color: #34495e;
    font-size: 1.1rem;
}

.total-amount {
    font-weight: bold;
    color: #e74c3c;
    font-size: 1.3rem;
}

/* Estilos para los controles de cantidad */
.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.qty-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qty-value {
    min-width: 20px;
    text-align: center;
    font-weight: bold;
}

.remove-btn {
    width: 28px;
    height: 28px;
}

/* Estilos para la sección del cliente */
.customer-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
}

.customer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.customer-header h3 {
    margin: 0;
    color: #34495e;
    font-size: 1.3rem;
}

.customer-search {
    margin-bottom: 1rem;
}

.customer-details {
    margin-top: 1rem;
}

.customer-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
}

.info-item {
    display: flex;
    margin-bottom: 0.5rem;
}

.info-label {
    font-weight: bold;
    color: #34495e;
    min-width: 80px;
}

.info-value {
    color: #7f8c8d;
}

.no-customer {
    text-align: center;
    padding: 1.5rem;
    color: #7f8c8d;
    height: 30%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.no-customer i {
    font-size: 2rem;
    color: #bdc3c7;
    margin-bottom: 0.5rem;
}

.no-customer p {
    margin: 0;
}

/* Estilos para la sección de finalización */
.checkout-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
}

.checkout-card h3 {
    color: #34495e;
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 1rem;
}

.notes-input {
    width: 100%;
    margin-bottom: 1rem;
}

.confirm-btn {
    width: 100%;
    padding: 0.75rem;
    font-size: 1.1rem;
    background-color: #2ecc71;
    border: none;
}

.confirm-btn:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}

/* Estilos para el diálogo del cliente */
.customer-dialog {
    border-radius: 12px;
}

.save-customer-btn {
    background-color: #3498db;
    border: none;
    padding: 0.75rem 1.5rem;
}

/* Estilos responsivos */
@media (max-width: 960px) {
    .main-layout {
        flex-direction: column;
    }

    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .search-box {
        width: 100%;
    }

    .menu-section,
    .order-section {
        flex: none;
        width: 100%;
    }
}

/* Animaciones */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.order-card,
.customer-card,
.checkout-card {
    animation: fadeIn 0.5s ease-out;
}
</style>