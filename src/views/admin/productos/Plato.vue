<template>
  <div class="card">
    <Toolbar class="mb-4">
      <template #start>
        <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="abrirNuevoPlato" />
      </template>
      <template #end>
        <Button label="Exportar PDF" icon="pi pi-upload" severity="danger" @click="exportPDF"
          style="margin-right: 10px;" />
        <Button label="Exportar CSV" icon="pi pi-upload" severity="help" @click="exportCSV" />
      </template>
    </Toolbar>

    <DataTable ref="dt" :value="platos" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
      :paginator="true" :rows="rows" @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[3, 10, 20]" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} platos"
      :exportable="true">

      <template #header>
        <div class="flex align-items-center justify-content-between">
          <h4 class="m-0">Gestión Platos</h4>
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="getPlatos" />
          </span>
        </div>
      </template>

      <Column field="id" header="ID" sortable style="min-width:12rem"></Column>
      <Column field="categoria.nombre" header="Categoría" sortable style="min-width:12rem" />
      <Column field="nombre" header="Nombre" sortable style="min-width:16rem"></Column>
      <Column field="precio_venta" header="Precio venta" sortable style="min-width:12rem">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.precio_venta) }}
        </template>
      </Column>
      
      <Column field="productos" header="Productos" sortable style="min-width:16rem">
        <template #body="{ data }">
          <template v-if="data.productos && data.productos.length">
            <Chip v-for="producto in data.productos" :key="producto.id" :label="producto.nombre" class="mr-2 mb-2" />
          </template>
          <Tag v-else severity="warning" value="Sin productos" />
        </template>
      </Column>

      <Column :exportable="false" style="min-width:8rem">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" rounded class="mr-2" @click="editPlato(slotProps.data)" />
          <Button icon="pi pi-trash" rounded severity="danger" @click="confirmDeletePlato(slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Toast ref="toast" />

    <!-- Dialog para editar plato -->
    <Dialog v-model:visible="platoDialog" :style="{ width: '450px' }" header="Detalles Plato" :modal="true"
      class="p-fluid">
      <div class="field">
        <label for="categoria">Categoría</label>
        <Dropdown id="categoria" v-model="plato.categoria_id" :options="categorias" optionLabel="nombre"
          optionValue="id" placeholder="Seleccione una categoría" class="w-full" />
        <small class="p-error" v-if="submitted && !plato.categoria_id">
          Categoría es obligatoria.
        </small>
      </div>

      <div class="field">
        <label for="nombre">Nombre</label>
        <InputText id="nombre" v-model="plato.nombre" required="true" autofocus />
      </div>

      <div class="field">
        <label for="precio_venta">Precio_venta</label>
        <InputNumber id="precio_venta" v-model="plato.precio_venta" mode="currency" currency="BOB" locale="es-BO" />
      </div>

      <div class="field">
        <label for="productos">Seleccionar Productos</label>
        <MultiSelect v-model="plato.productos" :options="productosDisponibles" optionLabel="nombre"
          placeholder="Selecciona productos" display="chip" :modelValue="plato.productos">
          <template #option="slotProps">
            <div>{{ slotProps.option.nombre }}</div>
          </template>
        </MultiSelect>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" text @click="guardarPlato" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import platoService from '../../../services/plato.service';
import categoriaService from '../../../services/categoria.service';
import productoService from '../../../services/producto.service';
import Toast from 'primevue/toast';
import { ref, onMounted } from 'vue';

const platos = ref([]);
const categorias = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const buscar = ref('');
const platoDialog = ref(false);
const lazyParams = ref({ page: 0, rows: rows.value });
const plato = ref({
  id: null,
  nombre: '',
  precio_venta: null,
  categoria_id: null,
  productos: [],
});
const productosDisponibles = ref([]);
const dt = ref(null);
const toast = ref(null);
const submitted = ref(false);

onMounted(() => {
  getCategorias();
  getPlatos();
  getProductos();
});

const getPlatos = async () => {
  loading.value = true;
  try {
    const { data } = await platoService.index(lazyParams.value.page + 1, lazyParams.value.rows, buscar.value);
    platos.value = data.data.map(plato => ({
      ...plato,
      productos: plato.productos || [] 
    }));
    totalRecords.value = data.total;
  } catch (error) {
    console.error('Error al obtener platos:', error);
    toast.value.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los platos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const getCategorias = async () => {
  try {
    const { data } = await categoriaService.index();
    categorias.value = data.data.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
    }));
  } catch (error) {
    console.error('Error al obtener categorías:', error);
  }
};

const getProductos = async () => {
  try {
    const { data } = await productoService.index();
    productosDisponibles.value = data.data.map((prod) => ({
      id: prod.id,
      nombre: prod.nombre,
    }));
  } catch (error) {
    console.error('Error al obtener productos:', error);
  }
};

const formatCurrency = (value) => {
  return value ? value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) : '';
};

const abrirNuevoPlato = () => {
  plato.value = {
    id: null,
    nombre: '',
    precio_venta: null,
    productos: []
  };
  platoDialog.value = true;
};

const hideDialog = () => {
  platoDialog.value = false;
};

const guardarPlato = async () => {
  submitted.value = true;

  // Validación básica
  if (!plato.value.nombre || !plato.value.precio_venta || !plato.value.categoria_id) {
    toast.value.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Nombre, categoría y precio son campos requeridos',
      life: 5000
    });
    return;
  }

  // Depurar los productos antes de mapear
  console.log("Productos antes de la validación:", plato.value.productos);

  // Validación de productos (cada producto debe tener un ID válido)
  const productosArray = plato.value.productos.map(p => {
    // Verificar si cada producto tiene un id
    if (!p.id) {
      console.error("Producto sin ID:", p);
      throw new Error("Cada producto debe tener un ID válido.");
    }
    return p.id;
  });

  const datosPlato = {
    nombre: plato.value.nombre,
    precio_venta: plato.value.precio_venta,
    categoria_id: plato.value.categoria_id,
    productos: productosArray
  };

  try {
    // Verificar si estamos actualizando o creando un plato
    if (plato.value.id) { 
      const response = await platoService.update(plato.value.id, datosPlato);
      if (response && response.status === 200) {
        toast.value.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Plato actualizado correctamente',
          life: 3000
        });
      }
    } else {
      const response = await platoService.store(datosPlato);
      if (response && response.status === 201) {
        toast.value.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Plato creado correctamente',
          life: 3000
        });
      }
    }

    // Cerrar el diálogo y resetear los datos del plato
    platoDialog.value = false;
    plato.value = {
      id: null,
      nombre: '',
      precio_venta: null,
      categoria_id: null,
      productos: []
    };

    // Obtener la lista de platos nuevamente
    await getPlatos();
  } catch (error) {
    console.error('Error completo:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el plato';
    toast.value.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    });
  }
};



const editPlato = (platoData) => {
  plato.value = {
    ...platoData,
    productos: platoData.productos ? platoData.productos.map(p => ({ id: p.id, nombre: p.nombre })) : []
  };
  platoDialog.value = true;
};

const confirmDeletePlato = (platoData) => {
  // Confirmación de eliminación del plato
  toast.value.add({
    severity: 'warn',
    summary: 'Confirmar eliminación',
    detail: '¿Estás seguro de eliminar este plato?',
    life: 3000
  });
  // Implementar la eliminación lógica aquí
};
</script>

<style scoped>
::v-deep(.p-datatable-thead > tr > th) {
  background-color: #65a8d4;
  color: white;
  font-weight: bold;
}
</style>
