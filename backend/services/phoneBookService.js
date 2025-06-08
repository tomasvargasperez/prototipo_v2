const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const https = require('https');

class PhoneBookService {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_'
        });
        this.phoneBookUrl = 'https://icafal.alodesk.io:20080/panel/share/phonebook/9267361683';
        this.cachedData = null;
        this.lastFetch = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos en milisegundos
        
        // Configuración de axios para ignorar errores de certificado
        this.axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
    }

    async fetchPhoneBook() {
        try {
            // Verificar si tenemos datos en caché válidos
            if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
                return this.cachedData;
            }

            // Hacer la petición al servidor XML usando la instancia configurada
            const response = await this.axiosInstance.get(this.phoneBookUrl);
            
            // Parsear el XML a JSON
            const result = this.parser.parse(response.data);
            
            // Actualizar el caché
            this.cachedData = this.processPhoneBookData(result);
            this.lastFetch = Date.now();

            return this.cachedData;
        } catch (error) {
            console.error('Error fetching phone book:', error);
            throw new Error('Error al obtener el directorio telefónico');
        }
    }

    processPhoneBookData(data) {
        try {
            // Verificar que tenemos la estructura esperada
            if (!data.YealinkIPPhoneDirectory || !data.YealinkIPPhoneDirectory.DirectoryEntry) {
                throw new Error('Formato de datos inesperado');
            }

            // Extraer y formatear los datos
            const entries = data.YealinkIPPhoneDirectory.DirectoryEntry;
            
            // Convertir a un formato más limpio y ordenado
            const formattedData = {
                total: entries.length,
                lastUpdate: new Date().toISOString(),
                entries: entries
                    .map(entry => ({
                        name: entry.Name.trim(),
                        extension: entry.Telephone.toString(),
                        // Agregamos campos adicionales que podrían ser útiles
                        searchText: `${entry.Name.trim()} ${entry.Telephone}`.toLowerCase()
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar por nombre
            };

            return formattedData;
        } catch (error) {
            console.error('Error processing phone book data:', error);
            throw new Error('Error al procesar los datos del directorio telefónico');
        }
    }

    // Método auxiliar para buscar en el directorio
    async searchDirectory(query) {
        const data = await this.fetchPhoneBook();
        if (!query) return data.entries;

        const searchText = query.toLowerCase();
        return data.entries.filter(entry => 
            entry.searchText.includes(searchText)
        );
    }
}

module.exports = new PhoneBookService(); 