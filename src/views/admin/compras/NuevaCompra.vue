<template>
    <div class="container">
        <h1>Nueva Compra</h1>
        <div class="grid">
            <!-- Sección de Productos -->
            <div class="md:col-7 col-12">
                <div class="card">
                    <DataTable ref="dt" :value="productos" dataKey="id" lazy :totalRecords="totalRecords" 
                        :loading="loading" :paginator="true" :rows="rows" @page="onPage"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[5, 10, 20, 50]"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos">

                        <template #header>
                            <div class="flex align-items-center justify-content-between">
                                <h4 class="m-0">Productos Disponibles</h4>
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <InputText placeholder="Buscar por nombre..." v-model.trim="buscar" 
                                        @keypress.enter="getProductos" />
                                </span>
                            </div>
                        </template>

                        <Column field="nombre" header="NOMBRE" sortable style="min-width:10rem"></Column>
                        <Column field="stock" header="STOCK" sortable style="min-width:12rem">
                            <template #body="slotProps">
                                <Tag :severity="slotProps.data.stock <= 5 ? 'danger' : 'success'">
                                    {{ slotProps.data.stock }}
                                </Tag>
                            </template>
                        </Column>
                        <Column header="Imagen" style="min-width:8rem">
                            <template #body="slotProps">
                                <img :src="getImageUrl(slotProps.data.imagen)" :alt="slotProps.data.nombre" 
                                    class="product-image" />
                            </template>
                        </Column>
                        <Column field="precio" header="PRECIO" sortable style="min-width:8rem">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.precio) }}
                            </template>
                        </Column>
                        <Column field="categoria.nombre" header="CATEGORÍA" sortable style="min-width:8rem"></Column>
                        <Column header="ACCIONES" style="min-width:10rem">
                            <template #body="slotProps">
                                <Button icon="pi pi-plus" rounded severity="success" class="mr-2"
                                    @click="addCarrito(slotProps.data)"
                                    :disabled="slotProps.data.stock <= 0"
                                    v-tooltip="slotProps.data.stock <= 0 ? 'Producto sin stock' : 'Agregar al carrito'" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Sección del Carrito y Proveedor -->
            <div class="md:col-5 col-12">
                <div class="grid">
                    <!-- Carrito de Compras -->
                    <div class="col-12">
                        <div class="card">
                            <h4>Carrito de Compras</h4>
                            <DataTable :value="carrito" :scrollable="true" scrollHeight="300px"
                                class="p-datatable-sm" :emptyMessage="carritoEmptyMessage">
                                <Column field="nombre" header="PRODUCTO"></Column>
                                <Column header="PRECIO UNIT." style="width:120px">
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.precio) }}
                                    </template>
                                </Column>
                                <Column field="cantidad" header="CANT." style="width:100px"></Column>
                                <Column header="SUBTOTAL" style="width:120px">
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.precio * slotProps.data.cantidad) }}
                                    </template>
                                </Column>
                                <Column header="ACCIONES" style="width:180px">
                                    <template #body="slotProps">
                                        <Button icon="pi pi-plus" rounded severity="info" class="mr-2 p-button-sm"
                                            @click="aumentarCantidad(slotProps.data)"
                                            v-tooltip="'Aumentar cantidad'" />
                                        <Button icon="pi pi-minus" rounded severity="warning" class="mr-2 p-button-sm"
                                            @click="reducirCantidad(slotProps.data)"
                                            :disabled="slotProps.data.cantidad <= 1"
                                            v-tooltip="'Reducir cantidad'" />
                                        <Button icon="pi pi-trash" rounded severity="danger" class="p-button-sm"
                                            @click="quitarCarrito(slotProps.data)"
                                            v-tooltip="'Eliminar del carrito'" />
                                    </template>
                                </Column>
                            </DataTable>
                            
                            <Divider />
                            
                            <div class="flex justify-content-between align-items-center p-3">
                                <span class="text-xl font-bold">TOTAL:</span>
                                <span class="text-xl font-bold">{{ formatCurrency(totalCarrito) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Datos del Proveedor -->
                    <div class="col-12">
                        <div class="card">
                            <div class="flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
                                <h4 class="m-0">Proveedor</h4>
                                <div class="flex gap-2">
                                    <Button icon="pi pi-plus" rounded severity="success" 
                                        @click="visible = true" v-tooltip="'Nuevo proveedor'" />
                                    <span class="p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText placeholder="Buscar por CI/NIT..." v-model.trim="buscar_proveedor" 
                                            @keypress.enter="busquedaProveedor" />
                                    </span>
                                </div>
                            </div>
                            
                            <div v-if="proveedor_seleccionado && proveedor_seleccionado.id" class="p-3 border-round surface-100">
                                <h5 class="mt-0">Datos del Proveedor</h5>
                                <div class="grid">
                                    <div class="col-6">
                                        <p><strong>Nombre:</strong> {{ proveedor_seleccionado.nombre }}</p>
                                        <p><strong>CI/NIT:</strong> {{ proveedor_seleccionado.ci_nit }}</p>
                                    </div>
                                    <div class="col-6">
                                        <p><strong>Teléfono:</strong> {{ proveedor_seleccionado.telefono || 'No registrado' }}</p>
                                        <Button icon="pi pi-times" label="Cambiar" severity="secondary" 
                                            class="p-button-sm" @click="proveedor_seleccionado = {}" />
                                    </div>
                                </div>
                            </div>
                            <div v-else class="p-3 text-center text-500">
                                <i class="pi pi-info-circle mr-2"></i>
                                Seleccione o registre un proveedor
                            </div>
                        </div>
                    </div>

                    <!-- Acciones Finales -->
                    <div class="col-12">
                        <div class="card">
                         
                     
                            
                            <div class="flex justify-content-end gap-2">
                                <Button label="Limpiar" icon="pi pi-trash" severity="danger" 
                                    @click="limpiarTodo" :disabled="carrito.length === 0" />
                                <Button label="Registrar Compra" icon="pi pi-check" severity="success"
                                    @click="guardarCompra" :disabled="!validarCompra"
                                    v-tooltip="!validarCompra ? 'Debe tener productos en el carrito y seleccionar un proveedor' : ''" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Diálogo para Nuevo Proveedor -->
        <Dialog v-model:visible="visible" modal header="Nuevo Proveedor" :style="{ width: '60rem' }"
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <div class="field">
                <label for="nombre">Nombre Completo *</label>
                <InputText id="nombre" v-model.trim="proveedor.nombre" 
                    :class="{ 'p-invalid': submitted && !proveedor.nombre }" />
                <small class="p-error" v-if="submitted && !proveedor.nombre">
                    Nombre es obligatorio.
                </small>
            </div>

            <div class="field">
                <label for="contacto">Contacto</label>
                <InputText id="contacto" v-model.trim="proveedor.contacto" />
            </div>

            <div class="field">
                <label for="telefono">Teléfono</label>
                <InputText id="telefono" v-model.trim="proveedor.telefono" />
            </div>

            <div class="field">
                <label for="email">email</label>
                <InputText id="email" v-model.trim="proveedor.email" />
            </div>
            <div class="field">
                <label for="direccion">direccion</label>
                <InputText id="direccion" v-model.trim="proveedor.direccion" />
            </div>
            
            <div class="field">
                <label for="ci_nit">CI/NIT *</label>
                <InputText id="ci_nit" v-model.trim="proveedor.ci_nit" 
                    :class="{ 'p-invalid': submitted && !proveedor.ci_nit }" />
                <small class="p-error" v-if="submitted && !proveedor.ci_nit">
                    CI/NIT es obligatorio.
                </small>
            </div>
            
            
            
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="cerrarDialogo" />
                <Button label="Guardar" icon="pi pi-check" severity="success" @click="guardarProveedor" />
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import proveedorService from '../../../services/proveedor.service';
import compraService from '../../../services/compra.service';
import productoService from '../../../services/producto.service';

const toast = useToast();

// Variables reactivas
const productos = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: rows.value });
const buscar = ref('');
const buscar_proveedor = ref('');
const proveedor_seleccionado = ref({});
const carrito = ref([]);
const observaciones = ref('');
const proveedor = ref({});
const visible = ref(false);
const submitted = ref(false);

// Computed properties
const totalCarrito = computed(() => {
    return carrito.value.reduce((total, item) => total + (item.precio * item.cantidad), 0);
});

const carritoEmptyMessage = computed(() => {
    return carrito.value.length === 0 ? 'No hay productos en el carrito' : '';
});

const validarCompra = computed(() => {
    return carrito.value.length > 0 && proveedor_seleccionado.value?.id;
});

// Métodos
const getImageUrl = (imagePath) => {
    return imagePath ? `http://127.0.0.1:8000/storage/${imagePath}` : 'https://via.placeholder.com/50';
};

const formatCurrency = (value) => {
    return value ? value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) : '$0.00';
};

const getProductos = async () => {
    loading.value = true;
    try {
        const page = lazyParams.value.page + 1;
        const limit = lazyParams.value.rows;
        const { data } = await productoService.index(page, limit, buscar.value);
        productos.value = data.data;
        totalRecords.value = data.total;
    } catch (error) {
        showError('Error al cargar productos', error);
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    lazyParams.value.page = event.page;
    lazyParams.value.rows = event.rows;
    getProductos();
};

const addCarrito = (producto) => {
    if (producto.stock <= 0) {
        showWarning('Producto sin stock disponible');
        return;
    }

    const productoExistente = carrito.value.find(p => p.id === producto.id);
    
    if (productoExistente) {
        if (productoExistente.cantidad >= producto.stock) {
            showWarning('No hay suficiente stock disponible');
            return;
        }
        productoExistente.cantidad++;
    } else {
        carrito.value.push({ 
            id: producto.id, 
            nombre: producto.nombre, 
            precio: producto.precio, 
            cantidad: 1,
            stock_disponible: producto.stock
        });
    }
    
    showSuccess('Producto agregado al carrito');
};

const quitarCarrito = (producto) => {
    carrito.value = carrito.value.filter(p => p.id !== producto.id);
    showSuccess('Producto eliminado del carrito');
};

const aumentarCantidad = (producto) => {
    const productoEnCarrito = carrito.value.find(p => p.id === producto.id);
    if (productoEnCarrito) {
        if (productoEnCarrito.cantidad >= productoEnCarrito.stock_disponible) {
            showWarning('No hay suficiente stock disponible');
            return;
        }
        productoEnCarrito.cantidad++;
    }
};

const reducirCantidad = (producto) => {
    const productoEnCarrito = carrito.value.find(p => p.id === producto.id);
    if (productoEnCarrito && productoEnCarrito.cantidad > 1) {
        productoEnCarrito.cantidad--;
    }
};

const busquedaProveedor = async () => {
    const { data } = await proveedorService.buscarProveedor(buscar_proveedor.value);
    proveedor_seleccionado.value = data;
};

const guardarCompra = async () => {
    if (!validarCompra.value) {
        showWarning('Complete todos los campos requeridos');
        return;
    }

    try {
        const compraData = {
            proveedor_id: proveedor_seleccionado.value.id,
            productos: carrito.value.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            })),
            observaciones: observaciones.value,
            total: totalCarrito.value
        };

        const { data } = await compraService.store(compraData);
        
        showSuccess('Compra registrada exitosamente');
        
        // Limpiar y resetear
        setTimeout(() => {
            carrito.value = [];
            proveedor_seleccionado.value = {};
            observaciones.value = '';
            getProductos(); // Actualizar stock
        }, 2000);

    } catch (error) {
        showError('Error al registrar la compra', error);
    }
};

const guardarProveedor = async () => {
    submitted.value = true;
    
    // Validación mejorada
    if (!proveedor.value.nombre || !proveedor.value.ci_nit) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Complete todos los campos obligatorios',
            life: 3000
        });
        return;
    }

    try {
        const response = await proveedorService.store(proveedor.value);
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Proveedor guardado exitosamente',
            life: 3000
        });
        
        // Cerrar diálogo y resetear formulario
        visible.value = false;
        proveedor_seleccionado.value = response.data; // Asignar el nuevo proveedor
        proveedor.value = {}; // Limpiar formulario
        submitted.value = false;
        
    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        
        const errorMessage = error.response?.data?.message || 'Hubo un error al guardar el proveedor';
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });
    }
};

const cerrarDialogo = () => {
    visible.value = false;
    proveedor.value = {};
    submitted.value = false;
};

const limpiarTodo = () => {
    carrito.value = [];
    observaciones.value = '';
    showSuccess('Carrito limpiado');
};

// Helpers para mostrar mensajes
const showSuccess = (message) => {
    toast.add({ severity: 'success', summary: 'Éxito', detail: message, life: 3000 });
};

const showError = (message, error) => {
    console.error(error);
    const errorMessage = error.response?.data?.message || error.message;
    toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: `${message}: ${errorMessage}`,
        life: 5000 
    });
};

const showWarning = (message) => {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: message, life: 3000 });
};

const showInfo = (message) => {
    toast.add({ severity: 'info', summary: 'Información', detail: message, life: 3000 });
};

// Lifecycle hooks
onMounted(() => {
    getProductos();
});
</script>

<style scoped>
.product-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
}

.container {
    padding: 1rem;
}

.card {
    margin-bottom: 1rem;
}
</style>