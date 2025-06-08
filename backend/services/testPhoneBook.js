const phoneBookService = require('./phoneBookService');

async function testPhoneBook() {
    try {
        console.log('Obteniendo directorio telefónico completo...');
        const data = await phoneBookService.fetchPhoneBook();
        console.log(`Total de entradas: ${data.total}`);
        console.log(`Última actualización: ${data.lastUpdate}`);
        console.log('\nPrimeras 5 entradas:');
        console.log(data.entries.slice(0, 5));

        // Probar la búsqueda
        console.log('\nBuscando "Mesa de Ayuda"...');
        const searchResults = await phoneBookService.searchDirectory('Mesa de Ayuda');
        console.log('Resultados de búsqueda:', searchResults);

    } catch (error) {
        console.error('Error en la prueba:', error.message);
    }
}

testPhoneBook(); 