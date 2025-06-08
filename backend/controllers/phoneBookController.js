const phoneBookService = require('../services/phoneBookService');

const phoneBookController = {
    // Obtener todo el directorio telefónico
    async getDirectory(req, res) {
        try {
            const directory = await phoneBookService.fetchPhoneBook();
            res.json(directory);
        } catch (error) {
            console.error('Error en getDirectory:', error);
            res.status(500).json({ 
                error: 'Error al obtener el directorio telefónico',
                message: error.message 
            });
        }
    },

    // Buscar en el directorio
    async searchDirectory(req, res) {
        try {
            const { query } = req.query;
            const results = await phoneBookService.searchDirectory(query);
            res.json({
                query,
                total: results.length,
                results
            });
        } catch (error) {
            console.error('Error en searchDirectory:', error);
            res.status(500).json({ 
                error: 'Error al buscar en el directorio',
                message: error.message 
            });
        }
    }
};

module.exports = phoneBookController; 