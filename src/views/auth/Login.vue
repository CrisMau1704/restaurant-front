<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden"
      style="background: url('/public/demo/images/fondo4.jpeg') no-repeat center center fixed; background-size: cover;">
      <div class="flex flex-column align-items-center justify-content-center">
          <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
              <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                <div class="text-center mb-5">
                        <img src="../../../public/demo/images/images2.jpg" alt="Image" height="250" class="mb-3" />
                        <div class="text-900 text-3xl font-medium mb-3">Bienvenido</div>
                        
                    </div>

                  <div>
                      <label for="email1" class="block text-900 text-xl font-medium mb-2">Correo electrónico</label>
                      <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="credenciales.email" />

                      <label for="password1" class="block text-900 font-medium text-xl mb-2">Contraseña</label>
                      <Password id="password1" v-model="credenciales.password" placeholder="Password" :toggleMask="true" class="w-full mb-3" inputClass="w-full" inputStyle="padding:1rem"></Password>

                      <div class="flex align-items-center justify-content-between mb-5 gap-5">
                          <div class="flex align-items-center">
                              <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                              <label for="rememberme1">Recordarme</label>
                          </div>
                          <a class="font-medium no-underline ml-2 text-right cursor-pointer" style="color: var(--primary-color)">¿Olvidaste tu contraseña?</a>
                      </div>
                      <Button label="Ingresar" class="w-full p-3 text-xl" @click="funIngresar()"></Button>
                  </div>
              </div>
          </div>
      </div>
  </div>
  <AppConfig simple />
</template>

<script setup>
import { ref } from 'vue';
import authService from '../../services/auth.service';
import { useRouter } from "vue-router";

const credenciales = ref({ email: "", password: "" });
const errors = ref({});
const router = useRouter();

async function funIngresar() {
  if (!credenciales.value.email || !credenciales.value.password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  try {
    const { data } = await authService.login(credenciales.value);
    console.log("Respuesta del servidor:", data);

    // Guarda el token
    localStorage.setItem("access_token", data.access_token);
    console.log("Token guardado:", localStorage.getItem("access_token"));

    // Guarda el rol si está disponible en la respuesta
    const rol = data.user?.rol || data.rol; // Asegúrate de acceder correctamente al rol
    if (rol) {
      localStorage.setItem("user_rol", rol); // Puedes usar esto después también
    }

    // Redirige según el rol
    if (rol === 'super_admin') {
      router.push('/admin/dashboard'); // o donde tú quieras
    } else if (rol === 'vendedor') {
      router.push('/admin/pedido'); // Lista ventas
    } else {
      router.push('/'); // Ruta por defecto
    }

  } catch (error) {
    console.log("Error:", error);
    if (error.response) {
      if (error.response.status === 422) {
        errors.value = error.response.data.errors || {};
      } else {
        alert(`Error: ${error.response.data.message || "Credenciales incorrectas"}`);
      }
    } else {
      alert("Error de conexión al servidor.");
    }
  }
}
</script>

