const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let token = null;

async function login() {
    try {
        console.log('🔑 Intentando login con credenciales...');
        const response = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@a.a',  // Reemplaza con un usuario válido
            password: 'Qwer123.-'         // Reemplaza con la contraseña correcta
        });
        
        token = response.data.token;
        console.log('✅ Login exitoso');
        console.log('🎫 Token recibido:', token?.substring(0, 20) + '...');
        return token;
    } catch (error) {
        console.error('❌ Error en login:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('  No se recibió respuesta del servidor');
            console.error('  Error:', error.message);
        } else {
            console.error('  Error:', error.message);
        }
        throw error;
    }
}

async function testGetDirectory() {
    try {
        console.log('\n📞 Probando obtener directorio telefónico...');
        const response = await axios.get(`${API_URL}/phonebook`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('\n📚 Directorio Telefónico:');
        console.log(`Total de entradas: ${response.data.total}`);
        console.log(`Última actualización: ${response.data.lastUpdate}`);
        console.log('\nPrimeras 5 entradas:');
        console.log(response.data.entries.slice(0, 5));
    } catch (error) {
        console.error('❌ Error al obtener directorio:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('  No se recibió respuesta del servidor');
            console.error('  Error:', error.message);
        } else {
            console.error('  Error:', error.message);
        }
    }
}

async function testSearch(query) {
    try {
        console.log(`\n🔍 Probando búsqueda con query: "${query}"...`);
        const response = await axios.get(`${API_URL}/phonebook/search`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { query }
        });
        
        console.log(`Resultados encontrados: ${response.data.total}`);
        console.log('Resultados:', response.data.results);
    } catch (error) {
        console.error(`❌ Error en búsqueda (query: ${query}):`);
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('  No se recibió respuesta del servidor');
            console.error('  Error:', error.message);
        } else {
            console.error('  Error:', error.message);
        }
    }
}

async function runTests() {
    try {
        console.log('🚀 Iniciando pruebas de endpoints...\n');
        
        // Login
        await login();

        // Probar obtener todo el directorio
        await testGetDirectory();

        // Probar búsquedas
        await testSearch('Mesa de Ayuda');
        await testSearch('9331'); // Buscando por extensión
    } catch (error) {
        console.error('\n❌ Error general en las pruebas:');
        console.error('  Error:', error.message);
    }
}

// Ejecutar las pruebas
runTests(); 