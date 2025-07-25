<template>
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="abrirNuevoProveedor" />
        </template>
        <template #end>
          <Button label="Exportar PDF" icon="pi pi-upload" severity="danger" @click="exportPDF"
            style="margin-right: 10px;" />
          <Button label="Exportar CSV" icon="pi pi-upload" severity="help" @click="exportCSV" />
        </template>
      </Toolbar>
  
      <DataTable ref="dt" :value="proveedores" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
        :paginator="true" :rows="rows" @page="onPage"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[3, 10, 20]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos">
        <template #header>
          <div class="flex align-items-center justify-content-between">
            <h4 class="m-0">Gestión Proveedores</h4>
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="getListaProveedores" />
            </span>
          </div>
        </template>
  
        <Column field="id" header="ID" sortable style="min-width:5rem"></Column>
        <Column field="nombre" header="NOMBRE" sortable style="min-width:16rem"></Column>
        <Column field="contacto" header="CONTACTO" sortable style="min-width:8rem"></Column>
        <Column field="telefono" header="TELEFONO" sortable style="min-width:8rem"></Column>
        <Column field="email" header="EMAIL" sortable style="min-width:16rem"></Column>
        <Column field="direccion" header="DIRECCION" sortable style="min-width:16rem"></Column>
        <Column field="ci_nit" header="NIT" sortable style="min-width:12rem"></Column>
        <Column field="website" header="WEBSITE" sortable style="min-width:12rem"></Column>

  
        <Column :exportable="false" style="min-width:8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil"  rounded class="mr-2" @click="editProveedor(slotProps.data)" />
            <Button icon="pi pi-trash"  rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
           
          </template>
        </Column>
      </DataTable>
  
      <!-- Contenedor para Toast -->
      <Toast ref="toast" />
  
      <!-- Dialog para detalles de la categoría -->
      <Dialog v-model:visible="ProveedorDialog" :style="{ width: '450px' }" header="Detalle Proveedor" :modal="true"
        class="p-fluid">
        <div class="field">
          <label for="name">Nombre</label>
          <InputText id="name" v-model.trim="proveedor.nombre" required="true" autofocus
            :invalid="submitted && !proveedor.nombre" />
          <small class="p-error" v-if="submitted && !proveedor.nombre">Nombre es obligatorio.</small>
        </div>

        <div class="field">
          <label for="name">Contacto</label>
          <InputText id="name" v-model.trim="proveedor.contacto" required="true" autofocus
            :invalid="submitted && !proveedor.contacto" />
          <small class="p-error" v-if="submitted && !proveedor.contacto">Nombre es obligatorio.</small>
        </div>

        <div class="field">
          <label for="name">Telefono</label>
          <InputText id="name" v-model.trim="proveedor.telefono" required="true" autofocus
            :invalid="submitted && !proveedor.telefono" />
          <small class="p-error" v-if="submitted && !proveedor.telefono">Nombre es obligatorio.</small>
        </div>

        <div class="field">
          <label for="name">Email</label>
          <InputText id="name" v-model.trim="proveedor.email" required="true" autofocus
            :invalid="submitted && !proveedor.email" />
          <small class="p-error" v-if="submitted && !proveedor.email">Nombre es obligatorio.</small>
        </div>

        <div class="field">
          <label for="name">Direccion</label>
          <InputText id="name" v-model.trim="proveedor.direccion" required="true" autofocus
            :invalid="submitted && !proveedor.direccion" />
          <small class="p-error" v-if="submitted && !proveedor.direccion">Nombre es obligatorio.</small>
        </div>

        <div class="field">
          <label for="name">NIT</label>
          <InputText id="name" v-model.trim="proveedor.ci_nit" required="true" autofocus
            :invalid="submitted && !proveedor.ci_nit" />
          <small class="p-error" v-if="submitted && !proveedor.ci_nit">Nombre es obligatorio.</small>
        </div>

  
        
  
        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog()" />
          <Button label="Guardar" icon="pi pi-check" text @click="guardarProveedor()" />
        </template>
      </Dialog>
  <!-- Dialog para eliminar producto -->
  <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true" class="p-fluid">
      <p>¿Estás seguro de que deseas eliminar este producto?</p>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="hideDeleteDialog" />
        <Button label="Sí" icon="pi pi-check" text severity="danger" @click="deleteProduct" />
      </template>
    </Dialog>
    
    </div>
  </template>
  
  <script setup>
  import proveedorService from '../../../services/proveedor.service';
  import { ref, onMounted } from 'vue';
  import Toast from 'primevue/toast'; // Importa el componente Toast

  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  
  const proveedores = ref([]);
  const proveedor = ref({
    nombre: "",
    contacto: "",
    telefono:"",
    email:"",
    direccion:"",
    ci_nit:"",
    estado: true,
  });
  
  const dt = ref(null); 
  
  const totalRecords = ref(0);
  const rows = ref(10); // Número de filas por página
  const loading = ref(false);
  const lazyParams = ref({ page: 0, rows: rows.value });
  const buscar = ref("");
  
  const visible = ref(false);
  const submitted = ref(false);
  const ProveedorDialog = ref(false);
  const deleteDialog = ref(false);
  const proveedorSeleccionado = ref(null); // Para almacenar el proveedor a eliminar
  
  // Referencia al componente Toast
  const toast = ref(null);
  
  onMounted(() => {
    getListaProveedores();
  });
  
  const getListaProveedores = async () => {
    loading.value = true;
    const page = lazyParams.value.page + 1;  // Se suma 1 porque el backend suele usar paginación 1-indexada
    const limit = lazyParams.value.rows;     // Número de filas por página

    try {
        // Llamar al servicio de proveedores con la paginación y búsqueda
        const { data } = await proveedorService.index(page, limit, buscar.value);

        // Filtrar los proveedores donde 'estado' es true
        proveedores.value = data.data.filter(proveedor => proveedor.estado === 1);

        // Asignar el total de registros para la paginación (puedes mantener el total sin filtrar si lo necesitas)
        totalRecords.value = data.total;

    } catch (error) {
        console.error("Error al obtener los proveedores:", error);
    } finally {
        loading.value = false;
    }
};


  
async function guardarProveedor() {
  try {
    if (proveedor.value.id) {
      // Actualizar proveedor existente
      await proveedorService.update(proveedor.value.id, proveedor.value);
      // Mensaje de éxito al actualizar
      toast.value.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado correctamente!', life: 3000 });
    } else {
      // Crear nuevo proveedor
      await proveedorService.store(proveedor.value);
      // Mensaje de éxito al crear
      toast.value.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor creado correctamente!', life: 3000 });
    }

    // Obtener la lista actualizada de proveedores
    await getListaProveedores();
    
    // Cerrar el diálogo de proveedor
    ProveedorDialog.value = false;

    // Resetear el formulario
    proveedor.value = { nombre: "", detalle: "", contacto: "", telefono:"", email:"", direccion:"", ci_nit:"", website:"" };

  } catch (error) {
    // Manejar error según el tipo de acción
    if (proveedor.value.id) {
      // Mensaje de error al editar
      toast.value.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar proveedor', life: 3000 });
    } else {
      // Mensaje de error al crear
      toast.value.add({ severity: 'error', summary: 'Error', detail: 'Ya existe un proveedor con ese nombre o error al crear', life: 3000 });
    }
    console.error("Error al guardar proveedor:", error);
  }
}

  
  const hideDialog = () => {
    ProveedorDialog.value = false;
    submitted.value = false;
  };
  
  const abrirNuevoProveedor = () => {
    proveedor.value = { estado: true };
  submitted.value = false;
  ProveedorDialog.value = true;
  };
  
  const onPage = (event) => {
    lazyParams.value.page = event.page; // Actualizar la página
    lazyParams.value.rows = event.rows;  // Actualizar el número de filas
  
    // Llamar a la API para obtener nuevas categorías con los parámetros actualizados
    getListaProveedores();  // Llamar a la función correcta
  };
  
  // Abrir diálogo para editar categoría
  const editProveedor = (selectedProveedor) => {
    proveedor.value = { ...selectedProveedor };
    ProveedorDialog.value = true;  // Corregido para usar la variable correcta
  };
  
  const exportCSV = () => {
    nextTick(() => {
      if (dt.value) {
        dt.value.exportCSV();
      } else {
        console.error('El DataTable no está disponible');
      }
    });
  };
  const exportPDF = () => {
    const doc = new jsPDF();
  
    doc.text('Lista de Categorias', 14, 10);
  
    const columns = ['ID', 'Nombre', 'Detalle'];
    const rows = categorias.value.map(categoria => [
    categoria.id,
    categoria.nombre,
    categoria.detalle
    ]);
  
    autoTable(doc, {
      startY: 20,
      head: [columns],
      body: rows,
    });
  
    doc.save('lista_productos.pdf');
  };





function confirmDeleteProduct(prov) {
  proveedorSeleccionado.value = prov;
  deleteDialog.value = true;
}

function hideDeleteDialog() {
  deleteDialog.value = false;
  proveedorSeleccionado.value = null;
}

const deleteProduct = async () => {
  try {
    await proveedorService.destroy(proveedorSeleccionado.value.id);
    toast.value.add({ severity: 'success', summary: 'Eliminado', detail: 'Proveedor eliminado correctamente.', life: 3000 });
    deleteDialog.value = false;
    await getListaProveedores(); // Recargar lista
  } catch (error) {
    toast.value.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proveedor.', life: 3000 });
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