<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <h4>Gestión de Roles</h4>
            </template>
            <template #end>
                <Button label="Exportar" icon="pi pi-upload" severity="help" @click="exportCSV" />
            </template>
        </Toolbar>

        <DataTable ref="dt" :value="usuarios" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
            :paginator="true" :rows="rows" @page="onPage"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 20]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios">
            <template #header>
                <div class="flex align-items-center justify-content-between">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search"></i>
                        <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="listarUsuarios" />
                    </span>
                </div>
            </template>

            <Column field="name" header="Nombre" sortable></Column>
            <Column field="email" header="Email" sortable></Column>
            <Column header="Roles">
                <template #body="slotProps">
                    <Chip v-for="role in slotProps.data.roles" :key="role.id" :label="role.nombre" class="mr-2 mb-2" />
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="slotProps">
                    <Button icon="pi pi-user-edit" rounded class="mr-2" 
                            @click="abrirDialogoRoles(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Toast ref="toast" />

        <!-- Diálogo para asignar roles -->
        <Dialog v-model:visible="dialogoRoles" modal header="Asignar Roles" :style="{ width: '25rem' }">
            <div class="field-checkbox" v-for="role in allRoles" :key="role.id">
                <Checkbox :id="'role-' + role.id" name="roles" :value="role.id" v-model="selectedRoles" />
                <label :for="'role-' + role.id">{{ role.nombre }}</label>
            </div>
            
            <div class="flex justify-content-end gap-2 mt-4">
                <Button type="button" label="Cancelar" severity="secondary" text @click="cerrarDialogo" />
                <Button type="button" label="Guardar" @click="guardarRoles" :loading="loading" />
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import usuarioService from '../../services/usuario.service';
import rolesService from '../../services/roles.service'; // Asumo que tienes este servicio
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const usuarios = ref([]);
const allRoles = ref([]);
const selectedRoles = ref([]);
const usuarioSeleccionado = ref(null);
const dialogoRoles = ref(false);
const loading = ref(false);
const totalRecords = ref(0);
const rows = ref(10);
const buscar = ref('');
const dt = ref(null);

onMounted(() => {
    listarUsuarios();
    obtenerRoles();
});

const listarUsuarios = async () => {
    loading.value = true;
    try {
        const response = await rolesService.getUsersWithRoles();
        console.log("Usuarios con roles:", response.data); // Verifica la estructura
        
        // Ajusta según tu respuesta real
        usuarios.value = response.data || [];
        
        if (usuarios.value.length === 0) {
            console.warn("La API devolvió 0 usuarios");
        }
    } catch (error) {
        console.error("Error completo:", {
            message: error.message,
            response: error.response?.data
        });
        toast.add({
            severity: 'error', 
            summary: 'Error',
            detail: error.response?.data?.message || 'Error al cargar usuarios',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const obtenerRoles = async () => {
    try {
        const response = await rolesService.getAllRoles();
        allRoles.value = response.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los roles',
            life: 3000
        });
    }
};

const abrirDialogoRoles = (usuario) => {
    usuarioSeleccionado.value = usuario;
    selectedRoles.value = usuario.roles.map(role => role.id);
    dialogoRoles.value = true;
};

const guardarRoles = async () => {
    loading.value = true;
    try {
        // Llamar al servicio para actualizar los roles del usuario
        const response = await rolesService.assignUserRoles(usuarioSeleccionado.value.id, selectedRoles.value);
        
        // Actualizar la lista de usuarios con los roles actualizados
        listarUsuarios();
        dialogoRoles.value = false;
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Roles actualizados correctamente',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron actualizar los roles',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};





// Resto de métodos permanecen igual...
</script>
<style scoped>
::v-deep(.p-datatable-thead > tr > th) {
    background-color: #65a8d4; /* Cambia a tu color deseado */
    color: white;              /* Color del texto */
    font-weight: bold;
}
</style>