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

        <!-- Mostrar Platos y Carrito -->
        <div class="contenido-pedido" v-if="categoriaSeleccionada">
            <!-- Platos -->
            <div class="platos-section">
                <Button icon="pi pi-arrow-left" label="Volver" @click="volverACategorias" class="mb-3" />
                <h2>Platos en {{ categoriaSeleccionada?.nombre || '' }}</h2>
                <div class="platos-grid">
                    <div v-for="plato in platos" :key="plato.id" class="plato-card" @click="addCarrito(plato)">
                        <img :src="`${import.meta.env.VITE_API_URL}/storage/${plato.imagen}`" :alt="plato.nombre" />
                        <h4>{{ plato.nombre }}</h4>
                        <p>{{ formatCurrency(plato.precio_venta) }}</p>
                    </div>
                </div>
            </div>

            <!-- Carrito -->
            <div class="carrito-section" v-if="carrito.length > 0">
                <h3>Carrito ({{ carrito.length }} platos)</h3>
                <div class="carrito-items">
                    <div v-for="item in carrito" :key="item.plato_id" class="carrito-item">
                        <img class="carrito-img" :src="`${import.meta.env.VITE_API_URL}/storage/${getImagenPlato(item.plato_id)}`"
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
                <div class="pagar-container">
                    <Button label="Pagar" icon="pi pi-credit-card" class="p-button-success"
                        @click="mostrarModalPago = true" />
                </div>
            </div>
        </div>

        <!-- Modal Pago -->
      <Dialog header="Procesar Pago" :visible="mostrarModalPago" @update:visible="mostrarModalPago = $event"
        @hide="resetModal" modal closable style="width: 500px">
    <div class="modal-content">
        <h3 class="total-pagar">Total a Pagar: {{ formatCurrency(montoTotal) }}</h3>

        <!-- Buscar cliente -->
        <div class="form-group">
            <label for="buscarCliente" class="input-label">Buscar Cliente</label>
            <InputText id="buscarCliente" v-model="busquedaCliente" @input="buscarCliente"
                placeholder="Escribe nombre o CI..." autocomplete="off" class="full-width-input" />
        </div>

        <!-- Mostrar datos cliente si existe -->
        <div class="customer-details" v-if="clienteSeleccionado && clienteSeleccionado.id">
            <div class="customer-card">
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

        <div v-else-if="busquedaCliente.length > 2 && !clienteSeleccionado" class="no-results">
            <small>No se encontró cliente</small>
        </div>

        <!-- Selección método de pago -->
        <div class="form-group">
            <label for="metodoPago" class="input-label">Método de Pago</label>
            <Dropdown id="metodoPago" :options="metodosPago" optionLabel="label" v-model="metodoPagoSeleccionado"
                placeholder="Selecciona un método" @change="onMetodoPagoChange" class="full-width-dropdown" />
        </div>

        <div v-if="metodoPagoSeleccionado && metodoPagoSeleccionado.value === 'efectivo'" class="efectivo-section">
            <div class="form-group">
                <label for="montoEntregado" class="input-label">Monto entregado</label>
                <InputText id="montoEntregado" v-model.number="montoEntregado" type="number" min="0"
                    @input="calcularCambio" class="full-width-input" />
            </div>
            <p class="cambio-text">Cambio: <span class="cambio-value">{{ formatCurrency(cambio) }}</span></p>
        </div>

        <div class="actions">
            <Button label="Confirmar Pago" icon="pi pi-check" class="confirm-button" :disabled="!puedePagar"
                @click="guardarPedido" />
        </div>
    </div>
</Dialog>
    </div>
    <Toast ref="toast" />
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import jsPDF from 'jspdf';


import categoriaService from "@/services/categoria.service";
import platoService from "@/services/plato.service";
import clienteService from "@/services/cliente.service";
import pedidoService from '../../../services/pedido.service';

import Toast from 'primevue/toast';
const categorias = ref([]);
const platos = ref([]);
const categoriaSeleccionada = ref(null);
const carrito = ref([]);
const toast = ref(null);
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
   if (busquedaCliente.value.toUpperCase() === 'S/N') {
    clienteSeleccionado.value = {
        id: 10,  // <-- Aquí el id correcto
        nombre_completo: 'S/N',
        ci_nit: '0',
        telefono: ''
    };
    return;
}


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


const guardarPedido = async () => {
    if (!clienteSeleccionado.value || !clienteSeleccionado.value.id) {
        toast.value.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Debe seleccionar un cliente antes de registrar el pedido',
            life: 3000
        });
        return;
    }

    const esConsumidorFinal = clienteSeleccionado.value.id === 10;

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

    let pedido = {
        cliente_id: clienteSeleccionado.value.id,
        estado: 1,
        platos: carrito.value.map(p => ({
            plato_id: p.plato_id || p.id,
            cantidad: p.cantidad,
            precio_venta: p.precio_venta
        })),
        monto_total: montoTotal.value,
        metodo_pago: metodoPagoSeleccionado.value?.value || null,
        monto_entregado: montoEntregado.value,
        cambio: cambio.value
    };

    try {
        const response = await pedidoService.store(pedido);

        toast.value.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido registrado correctamente',
            life: 3000
        });

        const pedidoImp = {
            id: response.data.id ?? Date.now(),
            fecha: new Date(),
            cliente: clienteSeleccionado.value,
            platos: carrito.value.map(p => ({
                nombre: p.nombre,
                pivot: {
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_venta
                }
            })),
            metodo_pago: metodoPagoSeleccionado.value?.value,
            efectivo: montoEntregado.value,
            cambio: cambio.value
        };

        if (esConsumidorFinal) {
            exportComanda(pedidoImp); // Solo comanda
        } else {
            exportPDF(pedidoImp);     // Factura
            exportComanda(pedidoImp); // y comanda
        }

        carrito.value = [];
        resetModal();

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
            precio_unitario.toFixed(2).padStart(15, ' '),
            subtotal.toFixed(2).padStart(15, ' ')
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
    // Mostrar cambio solo si método es efectivo
    if (pedidoData.metodo_pago === 'efectivo') {
        const efectivo = Number(pedidoData.efectivo) || 0;
        const cambio = efectivo - total;

        doc.text(`Efectivo: ${efectivo.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        doc.text(`Cambio: ${cambio.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
    }



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

const exportComanda = (pedidoData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150]  // Mucho más pequeño que la factura
    });

    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("COMANDA", pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Pedido No: ${pedidoData.id}`, margin, yPos);
    yPos += 8;

    pedidoData.platos.forEach(prod => {
        const cantidad = prod.pivot?.cantidad || 1;
        const nombre = prod.nombre || "Producto";

        const line = `${String(cantidad).padStart(3, ' ')} x ${nombre}`;
        doc.text(line, margin, yPos);
        yPos += 7;
    });

    yPos += 10;
    doc.setFontSize(8);
    doc.text("¡Gracias!", pageWidth / 2, yPos, { align: 'center' });

    // Guardar el archivo, o puedes mandar imprimir directo
    doc.save(`COMANDA_${pedidoData.id}.pdf`);
};


</script>

<style scoped>
.pedido-container {
    padding: 1rem;
    max-width: 1600px;
    margin: 0 auto;
}

/* Diseño de categorías */
.categorias-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.categoria-card {
    background: rgb(219, 216, 216);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    border: 1px solid #e2e8f0;
}

.categoria-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    border-color: #3498db;
}

.categoria-card i {
    font-size: 2.8rem;
    color: #3498db;
    margin-bottom: 1rem;
}

.categoria-card p {
    font-size: 1.3rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
}

/* Layout principal */
.contenido-pedido {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    align-items: flex-start;
}

/* Sección de platos */
.platos-section {
    flex: 1;
    background: #f5f9f7;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.platos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.plato-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    border: 1px solid #edf2f7;
    text-align: center;
    padding: 1rem;
}

.plato-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #3498db;
}

.plato-card img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 0.5rem;
}

.plato-card h4 {
    font-size: 1rem;
    margin: 0.5rem 0 0.2rem;
    color: #2d3748;
    font-weight: 600;
}

.plato-card p {
    font-size: 1rem;
    color: #e53e3e;
    font-weight: 700;
    margin: 0;
}

/* Sección del carrito */
.carrito-section {
    width: 420px;
    background: rgb(243, 241, 241);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    border: 1px solid #e2e8f0;
    position: sticky;
    top: 1rem;
    height: fit-content;
    font-size: 1.1rem;
}

.carrito-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.carrito-items {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.carrito-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #15599c;
    align-items: center;
}

.carrito-img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
}

.carrito-info h4 {
    font-size: 1.1rem;
    margin: 0 0 0.3rem 0;
    color: #2d3748;
    font-weight: bold;
}

.cantidad-control {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0.5rem 0;
}

.cantidad-control button {
    width: 34px;
    height: 34px;
    border: none;
    background: #3498db;
    color: white;
    border-radius: 6px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
}

.cantidad-control button:hover {
    background: #2c7be5;
}

.cantidad-control span {
    min-width: 26px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
}

.btn-eliminar {
    background: none;
    border: none;
    color: #e53e3e;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 0.5rem;
    transition: color 0.2s;
}

.btn-eliminar:hover {
    color: #c53030;
}

.total {
    font-weight: 700;
    font-size: 1.4rem;
    margin-top: 1.2rem;
    text-align: right;
    color: #2c3e50;
}

.pagar-container {
    margin-top: 1.5rem;
    text-align: right;
}

/* Responsive */
@media (max-width: 1024px) {
    .contenido-pedido {
        flex-direction: column;
    }

    .carrito-section {
        width: 100%;
        position: static;
        margin-top: 2rem;
    }
}

@media (max-width: 640px) {
    .platos-grid {
        grid-template-columns: 1fr 1fr;
    }

    .categorias-grid {
        grid-template-columns: 1fr 1fr;
    }
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
}

.total-pagar {
    background-color: #f8f9fa;
    color: #2c3e50;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-label {
    font-weight: 600;
    color: #495057;
    font-size: 0.9rem;
}

.full-width-input, .full-width-dropdown {
    width: 100%;
}

.customer-card {
    background-color: #f0f8ff;
    border-radius: 6px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.info-item {
    display: flex;
    gap: 0.5rem;
}

.info-label {
    font-weight: 600;
    color: #495057;
    min-width: 70px;
}

.info-value {
    color: #2c3e50;
}

.no-results {
    color: #e74c3c;
    text-align: center;
    font-size: 0.9rem;
    margin-top: -0.5rem;
}

.efectivo-section {
    background-color: #f9f9f9;
    border-radius: 6px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.cambio-text {
    margin: 0;
    text-align: right;
    font-weight: 500;
}

.cambio-value {
    color: #27ae60;
    font-weight: 600;
    font-size: 1.1rem;
}

.actions {
    display: flex;
    justify-content: flex-end;
}

.confirm-button {
    background-color: #27ae60;
    border: none;
    padding: 0.5rem 1.5rem;
}

.confirm-button:hover {
    background-color: #2ecc71 !important;
}

/* Estilos para los inputs de PrimeVue */
.p-inputtext {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px solid #ced4da;
}

.p-dropdown {
    width: 100%;
}

.p-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
