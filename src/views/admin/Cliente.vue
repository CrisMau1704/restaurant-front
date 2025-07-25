<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="abrirDialogoCliente" />

            </template>
            <template #end>

                <Button label="Exportar" icon="pi pi-upload" severity="help" @click="exportCSV" />
            </template>
        </Toolbar>

        <DataTable ref="dt" :value="clientes" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
            :paginator="true" :rows="rows" @page="onPage"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[3, 10, 20]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes">
            <template #header>
                <div class="flex align-items-center justify-content-between">
                    <h4 class="m-0">Gestión Clientes</h4>
                    <span class="p-input-icon-left">
                        <i class="pi pi-search"></i>
                        <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="listarClientes" />
                    </span>
                </div>
            </template>

            <Column field="id" header="ID" sortable></Column>
            <Column field="nombre_completo" header="NOMBRE" sortable></Column>
            <Column field="ci_nit" header="CI/NIT" sortable></Column>
            <Column field="telefono" header="TELEFONOSS" sortable></Column>
            <Column header="ACCIONES">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil"  rounded class="mr-2" @click="editarCliente(slotProps.data)" />
                    <Button icon="pi pi-trash"  rounded severity="danger"
                        @click="confirmarEliminar(slotProps.data.id)" />
                </template>
            </Column>
        </DataTable>

        <Toast ref="toast" />

        <!-- Dialogo para agregar o editar usuario -->


        <Dialog v-model:visible="dialogoCliente" modal header="Editar Cliente" :style="{ width: '25rem' }">
            
            <div class="flex align-items-center gap-3 mb-3">
                <label for="name" class="font-semibold w-6rem">Nombre</label>
                <InputText id="name" v-model.trim="cliente.nombre_completo" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <label for="email" class="font-semibold w-6rem">CI/NIT</label>
                <InputText id="email" v-model.trim="cliente.ci_nit" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <label for="telefono" class="font-semibold w-6rem">Telefono</label>
                <InputText id="telefono" v-model.trim="cliente.telefono" class="flex-auto" autocomplete="off" />
            </div>



            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" text @click="cerrarDialogo"></Button>
                <Button type="button" label="Save" @click="guardarCliente"></Button>
            </div>
        </Dialog>

        <!-- Dialogo de confirmación de eliminación -->
        <Dialog v-model:visible="dialogoEliminar" header="Confirmar" :modal="true" :style="{ width: '350px' }">
            <p>¿Está seguro de que desea eliminar este usuario?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="dialogoEliminar = false" />
                <Button label="Sí" icon="pi pi-check" text severity="danger" @click="eliminarUsuario" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import clienteService from '../../services/cliente.service';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';

const clientes = ref([]);
const cliente = ref({ nombre_completo: '', ci_nit: '', telefono: '' });
const buscar = ref('');
const dialogoCliente = ref(false);
const dialogoEliminar = ref(false);
const clienteEliminar = ref(null);

const loading = ref(false);
const totalRecords = ref(0);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: rows.value });

const dt = ref(null); // Definir 'dt' como un ref

const toast = ref(null);

onMounted(() => {
    listarClientes();
});

const listarClientes = async () => {
    loading.value = true;
    const page = lazyParams.value.page + 1;  // Se suma 1 porque el backend suele usar paginación 1-indexada
    const limit = lazyParams.value.rows;     // Número de filas por página

    try {
        // Llamar al servicio de categorías con la paginación y búsqueda
        const { data } = await clienteService.index(page, limit, buscar.value);

        // Asignar directamente los datos a usuarios sin filtrar
        clientes.value = data.data;

        // Asignar el total de registros para la paginación
        totalRecords.value = data.total;

    } catch (error) {
        console.error("Error al obtener los clientes:", error);
    } finally {
        loading.value = false;
    }
};

async function guardarCliente() {
    try {
        if (cliente.value.id) {
            await clienteService.update(cliente.value.id, cliente.value);
        } else {
            await clienteService.store(cliente.value);
        }
        toast.value.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente guardado', life: 3000 });
        listarClientes();
        cerrarDialogo();
    } catch (error) {
        toast.value.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
    }
}

function abrirDialogoCliente() {
    cliente.value = { nombre_completo: '', ci_nit: '', telefono: '' };
    dialogoCliente.value = true;
}

function cerrarDialogo() {
    dialogoCliente.value = false;
}

function editarCliente(clienteEditar) {
    cliente.value = { ...clienteEditar };
    dialogoCliente.value = true;
}

function confirmarEliminar(id) {
    clienteEliminar.value = id;
    dialogoEliminar.value = true;
}

function onPage(event) {
    listarClientes(event);
}

async function eliminarCliente() {
    try {
        await usuarioService.eliminarCliente(clienteEliminar.value);
        toast.value.add({ severity: 'warn', summary: 'Eliminado', detail: 'Cliente eliminado', life: 3000 });
        listarClientes();
        dialogoEliminar.value = false;
    } catch (error) {
        toast.value.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
}

function filtrarCliente() {
    lazyParams.value.page = 0; // Reiniciar a la primera página
    listarClientes();
}

const exportCSV = () => {
    // Check if DataTable is available and export
    if (dt.value) {
        dt.value.exportCSV();
    }
};
</script>
<style scoped>
::v-deep(.p-datatable-thead > tr > th) {
    background-color: #65a8d4; /* Cambia a tu color deseado */
    color: white;              /* Color del texto */
    font-weight: bold;
}
</style>