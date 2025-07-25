<template>
  <div class="card">
    <Toolbar class="mb-4">
      <template #start>
        <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="abrirNuevoProducto" />
      </template>
      <template #end>
        <Button label="Exportar PDF" icon="pi pi-upload" severity="danger" @click="exportPDF"
          style="margin-right: 10px;" />
        <Button label="Exportar CSV" icon="pi pi-upload" severity="help" @click="exportCSV" />


      </template>
    </Toolbar>

    <DataTable ref="dt" :value="productos" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
      :paginator="true" :rows="rows" @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[3, 10, 20]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos" :exportable="true">


      <template #header>
        <div class="flex align-items-center justify-content-between">
          <h4 class="m-0">Gestión Productos</h4>
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="getProductos" />
          </span>
        </div>
      </template>

      <Column field="id" header="ID" sortable style="min-width:12rem"></Column>
      <Column field="nombre" header="Producto" sortable style="min-width:16rem"></Column>
      <Column field="stock" header="STOCK" sortable style="min-width:16rem"></Column>
      <Column field="stock" header="Status" sortable style="min-width:12rem">
        <template #body="slotProps">
          <Tag :value="getStockStatus(slotProps.data.stock)" :severity="getStockSeverity(slotProps.data.stock)" />
        </template>
      </Column>



      <Column header="Imagen">
        <template #body="slotProps">
  {{ console.log(slotProps.data.imagen) }}
  <img 
    :src="`http://127.0.0.1:8000/storage/${slotProps.data.imagen}`" 
    alt="Imagen"
    style="width: 50px; height: 50px;" 
  />
</template>
      </Column>

      <Column field="precio_compra" header="Precio_compra" sortable style="min-width:8rem">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.precio_compra) }}
        </template>
      </Column>
      <Column field="categoria.nombre" header="Categoria" sortable style="min-width:10rem"></Column>

      <Column :exportable="false" style="min-width:8rem">
        <template #body="slotProps">
          
          
          <Button icon="pi pi-pencil" rounded class="mr-2" @click="editProduct(slotProps.data)" />
          <Button icon="pi pi-trash" rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Toast ref="toast" />

    <!-- Dialog para edición de producto -->
    <Dialog v-model:visible="productDialog" :style="{ width: '450px' }" header="Detalles Producto" :modal="true"
      class="p-fluid">

      <div class="field">
        <label for="categoria">Categoría</label>
        <Dropdown id="categoria" v-model="producto.categoria_id" :options="categorias" optionLabel="nombre"
          optionValue="id" placeholder="Seleccione una categoría" class="w-full" />
        <small class="p-error" v-if="submitted && !producto.categoria_id">
          Categoría es obligatoria.
        </small>
      </div>

      
      <div class="field">
        <label for="name">Nombre</label>
        <InputText id="name" v-model.trim="producto.nombre" required="true" autofocus
          :invalid="submitted && !producto.nombre" />
        <small class="p-error" v-if="submitted && !producto.nombre">Nombre es obligatorio.</small>
      </div>

      <div class="field">
        <label for="description">Unidad de medida</label>
        <Textarea id="description" v-model="producto.unidad_medida" rows="3" cols="20" />
      </div>

      

      <div class="formgrid grid">
        <div class="field col">
          <label for="price">Precio_compra</label>
          <InputNumber id="price" v-model="producto.precio_compra" mode="currency" currency="USD" locale="en-US" />
        </div>
        <div class="field col">
          <label for="quantity">Cantidad</label>
          <InputNumber id="quantity" v-model="producto.stock" integeronly />
        </div>
      </div>

      <div class="card flex justify-content-center">
        <FileUpload mode="basic" accept="image/*" :auto="true" :customUpload="true" @uploader="customBase64Uploader" />
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" text @click="guardarProducto" />
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

    <!-- Dialog para cambiar solo la imagen -->
    <Dialog v-model:visible="imageDialog" :style="{ width: '450px' }" header="Cambiar Imagen" :modal="true"
      class="p-fluid">
      <div class="field">
        <label for="image">Imagen</label>
        <FileUpload id="image" mode="basic" accept="image/*" :auto="true" :customUpload="true"
          @upload="customBase64Uploader" />

      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideImageDialog" />
        <Button label="Guardar Imagen" icon="pi pi-check" text @click="guardarImagen" />
      </template>
    </Dialog>

    <Dialog v-model:visible="mostrarDialogPDF" modal header="Visor PDF" :style="{ width: '80vw' }">
      <iframe v-if="pdfURL" :src="pdfURL" width="100%" height="600px" style="border: none;"></iframe>
    </Dialog>


  </div>
</template>

<script setup>
import productoService from '../../../services/producto.service';
import categoriaService from '../../../services/categoria.service';
import Toast from 'primevue/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { nextTick } from 'vue';

import { ref, onMounted } from 'vue';

const productos = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: rows.value });
const buscar = ref('');
const productDialog = ref(false);
const deleteDialog = ref(false);
const imageDialog = ref(false);
const submitted = ref(false);
const producto = ref({
  estado: true,
  categoria_id: null,
  precio_compra: null,
  imagen: null,
});
const fileUploadRef = ref(null);
const dt = ref(null);
const toast = ref(null);
const categorias = ref([]);
const newImage = ref(null);
const statuses = ref([
  { label: 'INSTOCK', value: 'instock' },
  { label: 'LOWSTOCK', value: 'lowstock' },
  { label: 'OUTOFSTOCK', value: 'outofstock' }
]);
const mostrarDialogPDF = ref(false);
const pdfURL = ref(null)
const productoSeleccionado = ref(null); // Para almacenar el proveedor a eliminar


onMounted(() => {
  getProductos();
  getCategorias();
});

const getProductos = async () => {
  loading.value = true;
  const page = lazyParams.value.page + 1;
  const limit = lazyParams.value.rows;

  try {
    const { data } = await productoService.index(page, limit, buscar.value);
    productos.value = data.data;
    totalRecords.value = data.total;
  } catch (error) {
    console.error('Error al obtener productos:', error);
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

const formatCurrency = (value) => {
  return value
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'BOB' })
    : '';
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


const abrirNuevoProducto = () => {
  producto.value = { estado: true, categoria_id: null, precio_compra: null, imagen: null };
  submitted.value = false;
  productDialog.value = true;
};

const hideDialog = () => {
  productDialog.value = false;
  submitted.value = false;
};

const customBase64Uploader = (event) => {
  const file = event.files[0];
  if (file && file.type.startsWith('image/')) {
    newImage.value = file;  // Aquí estamos asignando el archivo correctamente
    producto.value.imagen = file;  // Guarda la imagen seleccionada en producto.value.imagen
    console.log("Imagen seleccionada:", newImage.value);  // Verifica si se asigna correctamente
  } else {
    toast.value.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El archivo no es una imagen válida',
      life: 3000
    });
  }
};




const guardarProducto = async () => {
  try {
    const isNew = !producto.value.id;
    const result = isNew
      ? await productoService.store(producto.value, producto.value.imagen)
      : await productoService.update(producto.value.id, producto.value, producto.value.imagen);

    toast.value.add({
      severity: 'success',
      summary: 'Éxito', 
      detail: `Producto ${isNew ? 'creado' : 'actualizado'} correctamente`,
      life: 3000,
    });

    productDialog.value = false;
    getProductos();

    if (isNew) {
      producto.value = { estado: true, categoria_id: null, precio_compra: null, imagen: null };
      submitted.value = false;
    }
  } catch (error) {
    toast.value.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar el producto',
      life: 3000,
    });
  }
};


const guardarImagen = async () => {
  try {
    if (newImage.value) {  // Verifica si se ha seleccionado una imagen
      const formData = new FormData();
      formData.append('imagen', newImage.value);  // Agrega el archivo al FormData

      // Llamada a la API para actualizar solo la imagen
      await productoService.updateImage(producto.value.id, formData);

      toast.value.add({
        severity: "success",
        summary: "Éxito",
        detail: "Imagen actualizada correctamente",
        life: 3000
      });

      imageDialog.value = false;  // Cierra el diálogo
      getProductos();  // Actualiza la lista de productos
    } else {
      toast.value.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se ha seleccionado una imagen',  // Mensaje si no se seleccionó imagen
        life: 3000
      });
    }
  } catch (error) {
    console.error("Error al guardar imagen:", error);
    toast.value.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo actualizar la imagen",
      life: 3000
    });
  }
};




const hideImageDialog = () => {
  imageDialog.value = false;
};

const editProduct = (prod) => {
  producto.value = { ...prod };  // Cargar los datos del producto seleccionado
  productDialog.value = true;  // Mostrar el diálogo para editar el producto
};


const onPage = (event) => {
  lazyParams.value.page = event.page;
  lazyParams.value.rows = event.rows;
  getProductos();
};



function confirmDeleteProduct(prov) {
  productoSeleccionado.value = prov;
  deleteDialog.value = true;
}

function hideDeleteDialog() {
  deleteDialog.value = false;
  productoSeleccionado.value = null;
}

const deleteProduct = async () => {
  try {
    await productoService.destroy(productoSeleccionado.value.id);
    toast.value.add({ severity: 'success', summary: 'Eliminado', detail: 'Proveedor eliminado correctamente.', life: 3000 });
    deleteDialog.value = false;
    await getProductos(); // Recargar lista
  } catch (error) {
    toast.value.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proveedor.', life: 3000 });
  }
};

const getStockStatus = (stock) => {
  if (stock === 0) {
    return 'AGOTADO'; // Si el stock es 0
  } else if (stock > 0 && stock <= 5) {
    return 'ESTADO MÍNIMO'; // Si el stock está entre 1 y 5
  } else if (stock > 5) {
    return 'EN STOCK'; // Si el stock es mayor a 5
  }
  return ''; // En caso de que el stock sea inválido
};

const getStockSeverity = (stock) => {
  if (stock === 0) {
    return 'danger'; // Agotado: color rojo
  } else if (stock > 0 && stock <= 5) {
    return 'warning'; // Estado mínimo: color amarillo
  } else if (stock > 5) {
    return 'success'; // En stock: color verde
  }
  return null; // En caso de stock inválido
};



const exportPDF = () => {
  const doc = new jsPDF();

  doc.text('Lista de Productos', 14, 10);

  const columns = ['ID', 'Nombre', 'Stock', 'Precio_compra', 'Categoría'];
  const rows = productos.value.map(prod => [
    prod.id,
    prod.nombre,
    prod.stock,
    prod.precio_compra,
    prod.categoria?.nombre || 'Sin categoría'
  ]);

  autoTable(doc, {
    startY: 20,
    head: [columns],
    body: rows,
  });

  doc.save('lista_productos.pdf');
};

const abrirPDF = (data) => {
  console.log('Data del producto:', data); // Verifica qué contiene 'data'
  if (data.imagen) {  // Cambia .pdf por .imagen
    const urlPDF = `http://127.0.0.1:8000/storage/${data.imagen}`;
    console.log('URL del PDF:', urlPDF);  // Verifica si la URL es correcta
    pdfURL.value = urlPDF;
    mostrarDialogPDF.value = true;
  } else {
    console.error('No se ha encontrado el PDF asociado al producto.');
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