<template>
    <DataTable ref="dt" :value="pedidos" dataKey="id" lazy :totalRecords="totalRecords" :loading="loading"
        :paginator="true" :rows="rows" @page="onPage"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[3, 10, 20]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pedidos" :exportable="true">

        <template #header>
    <div class="flex align-items-center justify-content-between">
        <h4 class="m-0">Lista Ventas</h4>
        
        <!-- Usando PrimeVue Calendar para las fechas 
        <Calendar v-model="fi" showTime @change="getPedidos" placeholder="Seleccionar fecha y hora" style="width: 200px;"/>
        <Calendar v-model="ff" showTime @change="getPedidos" placeholder="Seleccionar fecha y hora" style="width: 200px;"/>-->

        <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <InputText placeholder="Buscar..." v-model="buscar" @keypress.enter="getPedidos" />
        </span>
    </div>
</template>


        <Column field="id" header="ID" sortable style="min-width:12rem"></Column>
        <Column field="fecha" header="Fecha" sortable style="min-width:16rem"></Column>
        <Column field="estado" header="Estado" sortable style="min-width:16rem">
            <template #body="slotProps">
                {{ slotProps.data.estado == 1 ? 'COMPLETADO' : 'PENDIENTE' }}
            </template>
        </Column>
        <Column field="monto_total" header="Monto total" sortable style="min-width:16rem"></Column>

        <Column field="cliente.nombre_completo" header="Cliente" sortable style="min-width:10rem"></Column>

        <Column :exportable="false" style="min-width:8rem" header="Acciones" >
            <template #body="slotProps">
                <Button icon="pi pi-file-pdf" rounded severity="danger" class="mr-2"
                    @click="exportPDF(slotProps.data)" />
                <Button icon="pi pi-search" rounded severity="warning" class="mr-2"
                    @click="abrir(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="pedidotDialog" :style="{ width: '650px' }" header="Detalles del Pedido" 
        :modal="true" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="order-detail-dialog">

    <!-- Encabezado con información principal -->
    <div class="order-header p-4 surface-50 border-round mb-3">
        <div class="flex justify-content-between align-items-center">
            <div>
                <span class="text-sm font-medium text-500 block">Pedido #</span>
                <span class="text-xl font-bold">{{ pedido.id }}</span>
            </div>
            <div class="text-right">
                <span class="text-sm font-medium text-500 block">Fecha</span>
                <span class="text-lg">{{ formatDateTime(pedido.fecha) }}</span>
            </div>
        </div>
    </div>

    <!-- Información del cliente -->
    <div class="customer-card p-4 mb-4 border-round surface-card shadow-1">
        <h5 class="mt-0 mb-3 flex align-items-center">
            <i class="pi pi-user mr-2"></i>
            Información del Cliente
        </h5>
        <div class="grid">
            <div class="col-12 md:col-6">
                <div class="field mb-3">
                    <label class="text-sm font-medium text-500 block mb-1">Nombre completo</label>
                    <div class="text-lg p-2 border-round bg-gray-50">{{ pedido.cliente?.nombre_completo || 'No especificado' }}</div>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field mb-3">
                    <label class="text-sm font-medium text-500 block mb-1">CI/NIT</label>
                    <div class="text-lg p-2 border-round bg-gray-50">{{ pedido.cliente?.ci_nit || 'No especificado' }}</div>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field mb-3">
                    <label class="text-sm font-medium text-500 block mb-1">Teléfono</label>
                    <div class="text-lg p-2 border-round bg-gray-50">{{ pedido.cliente?.telefono || 'No especificado' }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabla de productos -->
    <div class="products-section">
        <h5 class="mb-3 flex align-items-center">
            <i class="pi pi-shopping-cart mr-2"></i>
            Productos
        </h5>
        <DataTable :value="pedido.platos" stripedRows>
            <Column field="nombre" header="Producto"></Column>
            <Column header="Precio Unitario" style="width: 120px">
                <template #body="{ data }">
                {{ formatCurrency(data.pivot.precio_unitario) }}
                </template>
            </Column>
            <Column field="pivot.cantidad" header="Cantidad"></Column>
            <Column header="Subtotal" style="width: 120px">
                <template #body="{ data }">
                {{ formatCurrency(data.pivot.precio_unitario * data.pivot.cantidad) }}
                </template>
            </Column>
            </DataTable>
    </div>

    <!-- Resumen de totales -->
    <div class="totals-section p-4 mt-4 border-round surface-card">
        <div class="grid">
            <div class="col-6 text-right font-bold text-xl">Total:</div>
            <div class="col-6 text-right font-bold text-xl text-primary">
                {{ formatCurrency(calculateOrderTotal(pedido.platos)) }}
            </div>
        </div>
        <div class="text-sm mt-2 text-500">
            {{ numberToWords(calculateOrderTotal(pedido.platos)) }} bolivianos
        </div>
    </div>

    <template #footer>
        <div class="flex justify-content-between w-full">
            <Button label="Cerrar" icon="pi pi-times" @click="hideDialog" 
                    class="p-button-text" />
            <div>
                <Button label="Imprimir" icon="pi pi-print" @click="exportPDF(pedido)" 
                        class="mr-2" />
                <Button label="Enviar por correo" icon="pi pi-envelope" 
                        class="p-button-success" />
            </div>
        </div>
    </template>
</Dialog>
</template>

<script setup>
import pedidoService from '../../../services/pedido.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ref, onMounted } from 'vue';

const pedidos = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const rows = ref(10);
const lazyParams = ref({ page: 0, rows: rows.value });
const buscar = ref('');
const dt = ref(null);

const pedidotDialog = ref(false);
const pedido = ref({});

const fi = ref();
const ff = ref();

onMounted(() => {
    // Llamar a getPedidos sin pasar los filtros (fi, ff, buscar)
    fi.value = null;  // O cualquier valor predeterminado si no quieres filtrar por fecha
    ff.value = null;
    buscar.value = '';
    getPedidos();  // Cargar todos los pedidos al montar la página
});


const getPedidos = async () => {
    loading.value = true;
    const page = lazyParams.value.page + 1;
    const limit = lazyParams.value.rows;

    try {
        const { data } = await pedidoService.index(page, limit, buscar.value);
        console.log('Datos recibidos:', data); // Verifica la respuesta
        pedidos.value = data.data;
        totalRecords.value = data.total;

        // Verificar si los datos se asignan correctamente
        if (pedidos.value.length > 0) {
            console.log('Pedidos cargados:', pedidos.value);
        } else {
            console.log('No hay pedidos disponibles.');
        }

       
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    lazyParams.value.page = event.page;
    lazyParams.value.rows = event.rows;
    getPedidos();
};


const exportPDF = (pedidoData) => {
    if (!pedidoData || !pedidoData.platos) {
        console.error("Datos insuficientes para generar factura");
        return;
    }

    // Configuración optimizada para impresora térmica
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // 80mm de ancho (formato ticket)
    });

    // Estilos mejorados para mejor legibilidad
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10); // Tamaño ligeramente mayor
    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;

    // --- Encabezado mejorado ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("RESTAURANTE MI RESTAURANTE", pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    doc.setFontSize(9);
    doc.text("NIT: 123456789 | Teléfono: 12345678", pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text("Av. Principal #123, La Paz - Bolivia", pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Línea divisoria gruesa
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // --- Información de la factura ---
    doc.setFont('helvetica', 'bold');
    doc.text("FACTURA ORIGINAL", margin, yPos);
    doc.text(`No. ${pedidoData.id}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
    
    const fecha = pedidoData.fecha ? new Date(pedidoData.fecha) : new Date();
    doc.text("Fecha:", margin, yPos);
    doc.text(fecha.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }), pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;

    // --- Datos del cliente ---
    doc.setFont('helvetica', 'bold');
    doc.text("CLIENTE:", margin, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${pedidoData.cliente?.nombre_completo || "CONSUMIDOR FINAL"}`, margin + 5, yPos);
    yPos += 4;
    doc.text(`CI/NIT: ${pedidoData.cliente?.ci_nit || "0"}`, margin + 5, yPos);
    yPos += 6;

    // --- Tabla de productos mejorada ---
    // Encabezado de tabla
    doc.setFont('helvetica', 'bold');
    doc.text("CANT  DESCRIPCIÓN       P.UNIT   TOTAL", margin, yPos);
    yPos += 4;
    
    // Línea divisoria
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Detalle de productos
    doc.setFont('helvetica', 'normal');
    let total = 0;
    
    pedidoData.platos.forEach(prod => {
        const cantidad = prod.pivot?.cantidad || 1;
        const precio_unitario = Number(prod.pivot?.precio_unitario) || 0;
        const subtotal = cantidad * precio_unitario;
        total += subtotal;

        // Formato alineado para mejor legibilidad
        const line = [
            String(cantidad).padStart(3, ' '),
            (prod.nombre || "Producto").substring(0, 15).padEnd(15, ' '),
            precio_unitario.toFixed(2).padStart(7, ' '),
            subtotal.toFixed(2).padStart(8, ' ')
        ].join('  ');

        doc.text(line, margin, yPos);
        yPos += 5;
        
        // Control de salto de página
        if (yPos > 250) {
            doc.addPage([80, 297]);
            yPos = 10;
        }
    });

    // --- Totales ---
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text("TOTAL:", pageWidth - margin - 25, yPos);
    doc.text(`${total.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // --- Información legal ---
    doc.setFontSize(8);
    doc.text("SON: " + numberToWords(total) + " BOLIVIANOS", margin, yPos);
    yPos += 5;
    
    doc.text("CÓDIGO DE CONTROL:", margin, yPos);
    doc.text(generateControlCode(pedidoData.id, fecha), margin + 35, yPos);
    yPos += 4;
    
    doc.text("FECHA LÍMITE EMISIÓN:", margin, yPos);
    const fechaLimite = new Date(fecha);
    fechaLimite.setDate(fechaLimite.getDate() + 30);
    doc.text(fechaLimite.toLocaleDateString('es-BO'), margin + 35, yPos);
    yPos += 8;
    
    // Mensaje legal (requerido en Bolivia)
    doc.setFontSize(7);
    doc.text("ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS.", pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;
    doc.text("EL USO INDEBIDO SERÁ SANCIONADO DE ACUERDO A LEY.", pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // QR (simulado o real)
    doc.setFontSize(6);
    doc.text("AUTORIZACIÓN ELECTRÓNICA", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Espacio para código QR (implementación real requeriría librería QR)
    doc.setDrawColor(100);
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(pageWidth / 2 - 10, yPos, 20, 20, 2, 2, 'FD');
    doc.text("COD. QR", pageWidth / 2, yPos + 25, { align: 'center' });
    yPos += 30;
    
    // Agradecimiento y marca para corte
    doc.setFontSize(8);
    doc.text("¡Gracias por su preferencia!", pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text("••••••••••••••••••••••••••••••", pageWidth / 2, yPos, { align: 'center' });

    // Guardar el documento
    doc.save(`FACTURA_${pedidoData.id}.pdf`);
};

// Función para generar código de control (formato boliviano simplificado)
function generateControlCode(id, fecha) {
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return `${fecha.getDate()}${fecha.getMonth() + 1}${String(id).slice(-3)}-${code}`;
}

// Función mejorada para convertir números a palabras
function numberToWords(num) {
    num = Math.floor(Number(num) || 0);
    const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (num === 0) return 'cero';
    if (num < 10) return unidades[num];
    if (num < 20) return especiales[num - 10];
    if (num < 100) {
        const decena = Math.floor(num / 10);
        const unidad = num % 10;
        return decenas[decena] + (unidad !== 0 ? ' y ' + unidades[unidad] : '');
    }
    if (num < 1000) {
        const centena = Math.floor(num / 100);
        const resto = num % 100;
        return centenas[centena] + (resto !== 0 ? ' ' + numberToWords(resto) : '');
    }
    return num.toString(); // Para números mayores
}



const abrir = (pedi) => {
    pedido.value = pedi;
    pedidotDialog.value = true;
};

const hideDialog = () => {
    pedidotDialog.value = false;
};


const formatCurrency = (value) => {
  if (isNaN(value)) return 'Bs 0.00';
  return value.toLocaleString('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  });
};

const formatDateTime = (dateString) => {
    if (!dateString) return '--/--/---- --:--';
    const date = new Date(dateString);
    return date.toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const calculateOrderTotal = (platos) => {
    if (!platos) return 0;
    return platos.reduce((total, prod) => {
        const precio_unitario = prod.monto_total || prod.pivot?.precio_unitario || 0;
        return total + (precio_unitario * prod.pivot.cantidad);
    }, 0);
};

</script>


<style scoped>
::v-deep(.p-datatable-thead > tr > th) {
    background-color: #65a8d4; /* Cambia a tu color deseado */
    color: white;              /* Color del texto */
    font-weight: bold;
}

.order-detail-dialog .order-header {
    background-color: var(--surface-50);
    border-left: 4px solid var(--primary-color);
}

.order-detail-dialog .customer-card {
    border-top: 2px solid var(--surface-100);
}

.order-detail-dialog .p-datatable {
    font-size: 0.9rem;
}

.order-detail-dialog .p-datatable-sm .p-datatable-thead > tr > th {
    padding: 0.75rem;
    background-color: var(--surface-50);
    font-weight: 600;
}

.order-detail-dialog .totals-section {
    border-top: 2px dashed var(--surface-300);
    border-bottom: 2px dashed var(--surface-300);
    background-color: var(--surface-50);
}

.order-detail-dialog .field label {
    color: var(--text-color-secondary);
}

.order-detail-dialog .bg-gray-50 {
    background-color: var(--surface-50);
}
</style>