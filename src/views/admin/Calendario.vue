<template>
    <div>
        <!-- Calendario -->
        <vue-cal style="height: 600px;" default-view="month" :hide-view-selector="true"
            :disable-views="['years', 'year', 'week', 'day']" time="false" :events="eventos"
            @cell-click="abrirFormulario" />

        <!-- Modal de tarea -->
        <Dialog v-model:visible="mostrarModal" :style="{ width: '500px' }" header="Agregar Tarea" :modal="true"
            class="p-fluid">
            <div class="field">
                <label for="titulo">Título</label>
                <InputText id="titulo" v-model="tareas.titulo" required autofocus />
            </div>

            <div class="field">
                <label for="descripcion">Descripción</label>
                <Textarea id="descripcion" v-model="tareas.descripcion" rows="3" />
            </div>

            <div class="field">
                <label for="fecha_inicio">Fecha de Inicio</label>
                <Calendar id="fecha_inicio" v-model="tareas.fecha_inicio" dateFormat="yy-mm-dd" required />
            </div>

            <div class="field">
                <label for="fecha_fin">Fecha de Fin</label>
                <Calendar id="fecha_fin" v-model="tareas.fecha_fin" dateFormat="yy-mm-dd" required />
            </div>

            <div class="field">
                <label for="estado">Estado</label>
                <Dropdown 
                    id="estado" 
                    v-model="tareas.estado" 
                    :options="estadoOptions" 
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Selecciona el estado"
                    required
                />
            </div>

            <div class="field">
                <label for="area">Área</label>
                <Dropdown id="area" v-model="tareas.area_id" :options="areas" optionLabel="nombre" optionValue="id"
                    placeholder="Selecciona un área" class="w-full"  />
            </div>

            <div class="footer">
                <Button label="Guardar" icon="pi pi-check" @click="guardarTarea" />
                <Button label="Cancelar" icon="pi pi-times" @click="cerrarFormulario" class="p-button-secondary" />
            </div>
            <!-- Toast -->
            <Toast ref="toast" />
        </Dialog>
    </div>
</template>

<script setup>
import tareaService from '@/services/tarea.service'; 
import { ref, onMounted } from 'vue';
import Toast from 'primevue/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const tareas = ref({
    titulo: '',
    descripcion: '',
    area_id: null,
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
});

const areas = ref([]);
const estadoOptions = ref([
    { label: 'Por hacer', value: 'por hacer' },
    { label: 'Empezando', value: 'empezando' },
    { label: 'Finalizado', value: 'finalizado' },
]);

const eventos = ref([]);
const mostrarModal = ref(false);
const submitted = ref(false);
const loading = ref(false);
const toast = ref(null);  // Refactor para asegurar que el toast esté referenciado

const cargarAreas = async () => {
    try {
        const response = await tareaService.cargarAreas(); 
        areas.value = response.data;
    } catch (error) {
        console.error('Error al cargar las áreas:', error);
    }
};

const cargarEventos = async () => {
    try {
        // Lógica para cargar eventos
        eventos.value = []; // Cargar eventos aquí si es necesario
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
    }
};

const abrirFormulario = () => {
    mostrarModal.value = true;
    resetFormulario();
    cargarAreas(); 
};

const cerrarFormulario = () => {
    mostrarModal.value = false;
    submitted.value = false;
};

const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

const guardarTarea = async () => {
    try {
        if (!tareas.value.estado) {
            toast.value.add({ severity: 'error', summary: 'Error', detail: 'El campo "estado" es obligatorio', life: 3000 });
            return;
        }

        tareas.value.area_id = Number(tareas.value.area_id);
        if (isNaN(tareas.value.area_id) || tareas.value.area_id === 0) {
            toast.value.add({ severity: 'error', summary: 'Error', detail: 'El campo "área" es obligatorio y debe ser un número válido', life: 3000 });
            return;
        }

        if (!tareas.value.titulo) {
            toast.value.add({ severity: 'error', summary: 'Error', detail: 'El campo "titulo" es obligatorio', life: 3000 });
            return;
        }

        tareas.value.fecha_inicio = formatDate(tareas.value.fecha_inicio);
        tareas.value.fecha_fin = formatDate(tareas.value.fecha_fin);

        // Asignar color al evento, por ejemplo, si el estado es "empezando", se marca el día con color
        const color = tareas.value.estado === 'empezando' ? 'orange' : 
                     (tareas.value.estado === 'finalizado' ? 'green' : 'red');

        const evento = {
            title: tareas.value.titulo,
            start: tareas.value.fecha_inicio,
            end: tareas.value.fecha_fin,
            color: color,  // Asignar color aquí
            estado: tareas.value.estado,
            area_nombre: tareas.value.area_id,  // Usar nombre de área si es necesario
        };

        // Agregar el evento a la lista de eventos
        eventos.value.push(evento);

        // Enviar datos a la API
        if (tareas.value.id) {
            await tareaService.update(tareas.value.id, tareas.value);
        } else {
            await tareaService.store(tareas.value);
        }

        toast.value.add({ severity: 'success', summary: 'Éxito', detail: 'Tarea guardada correctamente!', life: 3000 });

        // Cerrar y resetear formulario
        cerrarFormulario();
        resetFormulario();
    } catch (error) {
        console.error('Error al guardar la tarea:', error);
        toast.value.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la tarea', life: 3000 });
    }
};



const resetFormulario = () => {
    tareas.value.titulo = '';
    tareas.value.descripcion = '';
    tareas.value.area_id = null;
    tareas.value.estado = '';
    tareas.value.fecha_inicio = '';
    tareas.value.fecha_fin = '';
};

const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Tareas', 14, 10);

    const columns = ['ID', 'Titulo', 'Descripcion', 'Estado', 'Area'];
    const rows = eventos.value.map(evento => [
        evento.id,
        evento.titulo,
        evento.descripcion,
        evento.estado,
        evento.area_nombre
    ]);

    autoTable(doc, {
        startY: 20,
        head: [columns],
        body: rows,
    });

    doc.save('tareas.pdf');
};

const onPage = (event) => {
    loading.value = true;
    getListaTareas();
};

const getListaTareas = async () => {
    try {
        // Lógica para cargar las tareas desde el servidor
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    cargarEventos(); // Llamada a cargarEventos cuando el componente se monta
    cargarAreas(); 
});
</script>
