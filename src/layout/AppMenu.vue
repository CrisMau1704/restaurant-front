<script setup>
import { ref, onMounted } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import authService from '../services/auth.service';  // Asegúrate de que la ruta es correcta

const model = ref([]);

// Verifica si el rol se obtiene correctamente desde el servicio
onMounted(() => {
    const rol = authService.getUserRole();  // Obtener el rol del usuario desde el servicio

    console.log('Rol del usuario:', rol);  // Verifica si el rol se obtiene correctamente

    // Definir el menú según el rol del usuario
    if (rol === 'super_admin') {
        model.value = [
            {
                label: 'Inicio',
                items: [{ label: 'Administrador', icon: 'pi pi-fw pi-home', to: '/admin/dashboard' }]
            },
            {
                label: 'Gestion Platos y productos',
                items: [
                    { label: 'Categorias', icon: 'pi pi-fw pi-check-square', to: '/admin/categoria' },
                    { label: 'Productos', icon: 'pi pi-fw pi-id-card', to: '/admin/producto' },
                    { label: 'Proveedores', icon: 'pi pi-fw pi-user-plus', to: '/admin/proveedor' },
                    { label: 'Platos', icon: 'pi pi-fw pi-list', to: '/admin/plato' }
                ]
            },
            {
                label: 'Usuarios',
                items: [
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user', to: '/admin/usuario', badge: 'NEW' },
                    { label: 'Clientes', icon: 'pi pi-fw pi-user-plus', to: '/admin/cliente', target: '_blank' }
                ]
            },
            {
                label: 'Gestion Ventas',
                items: [
                    { label: 'Lista ventas', icon: 'pi pi-fw pi-list', to: '/admin/pedido' },
                    { label: 'Nueva Venta', icon: 'pi pi-fw pi-plus', to: '/admin/pedido/nuevo' }
                ]
            },
            {
                label: 'Gestion Compras',
                items: [
                    { label: 'Lista de compras', icon: 'pi pi-fw pi-list', to: '/admin/compras' },
                    { label: 'Nueva Compra', icon: 'pi pi-fw pi-plus', to: '/admin/compras/nuevo' }
                ]
            },
            {
                label: 'Configuracion',
                icon: 'pi pi-fw pi-briefcase',
                to: '/config',
                items: [
                    { label: 'Roles y Permisos', icon: 'pi pi-fw pi-user', to: '/admin/roles' }
                ]
            }
        ];
    } else if (rol === 'vendedor') {
        model.value = [
            {
                label: 'Gestion Ventas',
                items: [
                    { label: 'Lista ventas', icon: 'pi pi-fw pi-list', to: '/admin/pedido' },
                    { label: 'Nueva Venta', icon: 'pi pi-fw pi-plus', to: '/admin/pedido/nuevo' }
                ]
            }
        ];
    } else {
        console.log('Rol no reconocido:', rol);  // Si no hay rol, imprime un mensaje de error
    }
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="i">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss"></style>

<!--<style lang="scss">
.layout-sidebar {
  background-color: #1f2d3d !important;
  color: white;
}


.layout-menu {
  background-color: #1f2d3d !important; // fondo oscuro elegante

  li {
    margin: 0.3rem 0;

    a {
      display: block;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      color: #ffffff !important; // texto blanco
      text-decoration: none;

      transition: background-color 0.3s, color 0.3s;

      &:hover {
        background-color: #2d3f50 !important; // color al pasar el mouse
        color: #ffd700 !important; // dorado
      }

      .pi {
        margin-right: 0.5rem;
        color: #ffffff !important; // iconos blancos
      }
    }

    &.active-menuitem > a {
      background-color: #32475b !important; // fondo de item activo
      color: #00d8ff !important; // color cyan para item activo
    }
  }
}
</style>-->



