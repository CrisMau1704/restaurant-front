<template>
  <div class="card p-4">
    <Toolbar class="mb-4">
      <template #start>
        <h3 class="m-0">Reporte de Ventas por Periodo y Vendedor</h3>
      </template>
      <template #end>
        <Button label="Buscar" icon="pi pi-search" @click="buscar(1, rows)" />
      </template>
    </Toolbar>

    <!-- Filtros -->
    <div class="flex gap-3 flex-wrap mb-4 items-center">
      <Calendar
        v-model="filtro.fecha_inicio"
        placeholder="Desde"
        showIcon
        dateFormat="yy-mm-dd"
        class="min-w-[150px]"
      />
      <Calendar
        v-model="filtro.fecha_fin"
        placeholder="Hasta"
        showIcon
        dateFormat="yy-mm-dd"
        class="min-w-[150px]"
      />
      <Dropdown
        v-model="filtro.vendedor_id"
        :options="vendedores"
        optionLabel="nombre"
        optionValue="id"
        placeholder="Vendedor"
        class="min-w-[200px]"
        :disabled="vendedores.length === 0"
      />
    </div>

    <!-- Tabla de ventas -->
<DataTable
  :value="ventas"
  :lazy="true"
  :totalRecords="totalRecords"
  :loading="loading"
  :paginator="true"
  :rows="lazyParams.rows"
  :first="lazyParams.first"
  @page="onPage"
  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
  :rowsPerPageOptions="[5, 10, 20]"
  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ventas"
  dataKey="id"
>

      <Column field="fecha" header="Fecha" sortable style="min-width: 140px" />
      <Column header="Cliente" style="min-width: 200px">
        <template #body="slotProps">
          {{ slotProps.data.cliente?.nombre_completo ?? '-' }}
        </template>
      </Column>
      <Column header="Vendedor" style="min-width: 200px">
        <template #body="slotProps">
          {{ slotProps.data.user?.name ?? '-' }}
        </template>
      </Column>
      <Column field="monto_total" header="Total Bs" sortable style="min-width: 120px" />
    </DataTable>

    <!-- Totales -->
    <div class="mt-4 font-bold text-lg">
      Total Bs: {{ total.toFixed(2) }} | Número de ventas: {{ cantidad }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import periodoService from '../../../services/periodo.service';

const filtro = ref({
  fecha_inicio: null,
  fecha_fin: null,
  vendedor_id: null,
});

const ventas = ref([]);
const vendedores = ref([]);
const total = ref(0);
const cantidad = ref(0);


const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: 10, first: 0 });

// Cargar lista de vendedores para el filtro
const getUsuarios = async () => {
  try {
    const response = await periodoService.usuarios();
    vendedores.value = [{ id: null, nombre: 'Todos' }, ...response.data.map(u => ({
      id: u.id,
      nombre: u.name,
    }))];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
  }
};


const buscar = async () => {
  loading.value = true;
  const page = lazyParams.value.page + 1; // Backend usa páginas desde 1
  const limit = lazyParams.value.rows;

  const payload = {
    fecha_inicio: filtro.value.fecha_inicio?.toISOString().slice(0, 10) || null,
    fecha_fin: filtro.value.fecha_fin?.toISOString().slice(0, 10) || null,
    vendedor_id: filtro.value.vendedor_id || null,
    page,
    limit,
  };

  try {
    const { data } = await periodoService.ventas(payload);

    ventas.value = data.data || data.ventas || [];
    total.value = Number(data.total ?? 0); // 👈 corrección aquí
    cantidad.value = data.count || data.totalRecords || ventas.value.length;
    totalRecords.value = cantidad.value;
  } catch (error) {
    console.error('Error al buscar ventas:', error);
  } finally {
    loading.value = false;
  }
};



const onPage = (event) => {
  lazyParams.value.page = event.page;
  lazyParams.value.rows = event.rows;
  lazyParams.value.first = event.first; // importante mantener first sincronizado
  buscar();
};



onMounted(() => {
  getUsuarios();
  buscar();
});
</script>

<style scoped>
::v-deep(.p-datatable-thead > tr > th) {
  background-color: #65a8d4;
  color: white;
  font-weight: bold;
}
</style>
