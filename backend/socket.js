let io;

module.exports = {
    init: function(httpServer) {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174'],
                methods: ['GET', 'POST']
            }
        });
        return io;
    },
    getIO: function() {
        if (!io) {
            throw new Error('Socket.io no está inicializado');
        }
        return io;
    }
}; 