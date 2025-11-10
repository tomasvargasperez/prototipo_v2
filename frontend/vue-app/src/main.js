//import { createApp } from 'vue'
//import './style.css'
//import App from './App.vue'
//
//createApp(App).mount('#app')

// 👉 ACTIVAR SANITIZACIÓN AUTOMÁTICA (Protección XSS)
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor()

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'; //importacion para el uso en chat.vue

// 👉 Importar el router
import router from './router'

// 👉 Crear instancia de la app y usar router
const app = createApp(App)

app.use(router)

app.mount('#app')
