<template>
  <div class="dashboard p-4">
    <div class="grid">
      <!-- Tarjetas resumen -->
      <div class="col-12 md:col-6 lg:col-3" v-for="card in summaryCards" :key="card.title">
        <div class="surface-card shadow-2 p-4 border-round" :style="{ borderLeft: `5px solid ${card.color}` }">
          <div class="flex justify-content-between align-items-center">
            <div>
              <div class="text-sm font-medium text-500 mb-1">{{ card.title }}</div>
              <div class="text-2xl font-bold">{{ card.value }}</div>
              <div class="text-sm" :class="card.trend === 'up' ? 'text-green-500' : 'text-red-500'">
                <i :class="card.trend === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="mr-1"></i>
                {{ card.percentage }}% vs ayer
              </div>
            </div>
            <div class="flex-shrink-0" :style="{ color: card.color }">
              <i :class="card.icon" class="text-3xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos principales -->
      <div class="col-12 lg:col-8 mt-4">
        <div class="surface-card shadow-2 p-4 border-round">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="m-0">Ventas diarias (últimos 7 días)</h3>
            <Dropdown v-model="selectedDays" :options="[7, 15, 30]" optionLabel="" placeholder="Días" class="w-6rem" />
          </div>
          <Chart type="bar" :data="salesChartData" :options="salesChartOptions" height="300px" />
        </div>
      </div>

      <div class="col-12 lg:col-4 mt-4">
        <div class="surface-card shadow-2 p-4 border-round h-full">
          <h3 class="m-0 mb-4">Platos más vendidos</h3>
          <Chart type="pie" :data="topDishesData" :options="pieChartOptions" height="300px" />
        </div>
      </div>

      <!-- Tabla de últimas ventas -->
      <div class="col-12 mt-4">
        <div class="surface-card shadow-2 p-4 border-round">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="m-0">Últimos pedidos</h3>
            <Button label="Ver todos" icon="pi pi-list" class="p-button-text" />
          </div>
          <DataTable :value="recentOrders" :paginator="true" :rows="5" responsiveLayout="scroll">
            <Column field="id" header="ID" style="width: 80px"></Column>
            <Column field="cliente" header="Cliente"></Column>
            <Column field="mesero" header="Mesero"></Column>
            <Column field="total" header="Total">
              <template #body="slotProps">
                {{ formatCurrency(slotProps.data.total) }}
              </template>
            </Column>
            <Column field="fecha" header="Fecha/Hora"></Column>
            <Column header="Estado">
              <template #body="slotProps">
                <Tag :value="slotProps.data.estado" 
                     :severity="getOrderStatusSeverity(slotProps.data.estado)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Métricas adicionales -->
      <div class="col-12 md:col-6 mt-4">
        <div class="surface-card shadow-2 p-4 border-round h-full">
          <h3 class="m-0 mb-4">Ventas por mesero</h3>
          <Chart type="horizontalBar" :data="salesByWaiterData" :options="horizontalBarOptions" height="300px" />
        </div>
      </div>

      <div class="col-12 md:col-6 mt-4">
        <div class="surface-card shadow-2 p-4 border-round h-full">
          <h3 class="m-0 mb-4">Horarios pico</h3>
          <Chart type="line" :data="peakHoursData" :options="lineChartOptions" height="300px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Button from 'primevue/button';


const formatCurrency = (value) => {
  return value ? value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) : '';
};

const getOrderStatusSeverity = (status) => {
  switch(status) {
    case 'Completado': return 'success';
    case 'En preparación': return 'warning';
    case 'Cancelado': return 'danger';
    default: return 'info';
  }
};

// Tarjetas resumen
const summaryCards = ref([
  { title: 'Ventas hoy', value: '2,450 Bs', percentage: 12, trend: 'up', icon: 'pi pi-money-bill', color: '#4CAF50' },
  { title: 'Pedidos hoy', value: '34', percentage: 5, trend: 'up', icon: 'pi pi-shopping-cart', color: '#2196F3' },
  { title: 'Clientes nuevos', value: '8', percentage: 2, trend: 'down', icon: 'pi pi-user-plus', color: '#9C27B0' },
  { title: 'Plato destacado', value: 'Lomo Montado', percentage: 18, trend: 'up', icon: 'pi pi-star', color: '#FF9800' }
]);

// Gráfico de ventas
const selectedDays = ref(7);
const salesChartData = ref({});
const salesChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return formatCurrency(context.raw);
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value);
        }
      }
    }
  }
});

// Platos más vendidos
const topDishesData = ref({});
const pieChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.label}: ${context.raw} ventas (${context.percentage}%)`;
        }
      }
    }
  }
});

// Últimos pedidos
const recentOrders = ref([
  { id: 1254, cliente: 'Juan Pérez', mesero: 'Maria Gomez', total: 245, fecha: '15/06/2023 14:30', estado: 'Completado' },
  { id: 1253, cliente: 'Empresa XYZ', mesero: 'Carlos Ruiz', total: 320, fecha: '15/06/2023 13:15', estado: 'Completado' },
  { id: 1252, cliente: 'Ana Fernandez', mesero: 'Maria Gomez', total: 180, fecha: '15/06/2023 12:45', estado: 'En preparación' },
  { id: 1251, cliente: 'Roberto Paz', mesero: 'Luis Castro', total: 95, fecha: '15/06/2023 12:30', estado: 'Completado' },
  { id: 1250, cliente: 'Laura Méndez', mesero: 'Carlos Ruiz', total: 210, fecha: '15/06/2023 11:20', estado: 'Cancelado' }
]);

// Ventas por mesero
const salesByWaiterData = ref({});
const horizontalBarOptions = ref({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return formatCurrency(context.raw);
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value);
        }
      }
    }
  }
});

// Horarios pico
const peakHoursData = ref({});
const lineChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
});

onMounted(async () => {
  // Datos de gráfico de ventas
  salesChartData.value = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Ventas',
        backgroundColor: '#42A5F5',
        borderColor: '#42A5F5',
        data: [1250, 1900, 1700, 2100, 2450, 3200, 2800]
      }
    ]
  };

  // Platos más vendidos
  topDishesData.value = {
    labels: ['Lomo Montado', 'Silpancho', 'Pique Macho', 'Sajta de Pollo', 'Chuleta'],
    datasets: [
      {
        data: [45, 32, 28, 25, 18],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#9C27B0',
          '#FF9800',
          '#F44336'
        ]
      }
    ]
  };

  // Ventas por mesero
  salesByWaiterData.value = {
    labels: ['Maria Gomez', 'Carlos Ruiz', 'Luis Castro', 'Ana Perez'],
    datasets: [
      {
        label: 'Ventas',
        backgroundColor: '#607D8B',
        data: [5200, 4800, 4300, 3900]
      }
    ]
  };

  // Horarios pico
  peakHoursData.value = {
    labels: ['10-11', '11-12', '12-13', '13-14', '14-15', '19-20', '20-21'],
    datasets: [
      {
        label: 'Pedidos',
        data: [8, 15, 25, 30, 22, 18, 12],
        fill: true,
        borderColor: '#FF9800',
        tension: 0.4,
        backgroundColor: 'rgba(255, 152, 0, 0.1)'
      }
    ]
  };

  // Cargar datos reales del backend
  try {
    const ventasResponse = await pedidoService.getDashboardData();
    // Actualizar los datos con la respuesta del backend
    // summaryCards.value[0].value = formatCurrency(ventasResponse.ventasHoy);
    // etc...
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  }
});
</script>

<style scoped>
.dashboard {
  background-color: var(--surface-ground);
}

.surface-card {
  background: var(--surface-card);
  transition: transform 0.3s;
}

.surface-card:hover {
  transform: translateY(-3px);
}

.text-sm {
  font-size: 0.875rem;
}

.text-500 {
  color: var(--text-color-secondary);
}

.text-green-500 {
  color: #4CAF50;
}

.text-red-500 {
  color: #F44336;
}

.p-dropdown {
  width: 100px;
}

h3 {
  color: var(--text-color);
  font-size: 1.25rem;
}
</style>