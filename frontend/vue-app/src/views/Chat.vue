<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="sidebar">
        <div class="user-info">
          <div class="avatar">{{ getUserInitials() }}</div>
          <div class="user-name">{{ userName }}</div>
        </div>
        
        <div class="channels-section">
          <div class="chat-corporativo">
            <h3>Chat Corporativo</h3>
            <div class="channels-list">
              <div 
                v-for="channel in channels" 
                :key="channel._id"
                class="channel"
                :class="{ active: selectedChannel === channel._id }"
                @click="selectChannel(channel._id)"
              >
                <i :class="['fas', channel.isPublic ? 'fa-globe' : 'fa-lock']"></i>
                <span class="channel-name">{{ channel.name }}</span>
              </div>
            </div>
          </div>
          
          <div class="otras-opciones">
            <h3>Otras Opciones</h3>
            <div class="channels-list">
              <div 
                class="channel"
                :class="{ active: showSuggestionBox }"
                @click="toggleSuggestionBox"
              >
                <i class="fas fa-lightbulb"></i>
                <span class="channel-name">Buzón de Sugerencias</span>
              </div>
              
              <div 
                class="channel"
                :class="{ active: showAnnouncementsBox }"
                @click="toggleAnnouncementsBox"
              >
                <i class="fas fa-bullhorn"></i>
                <span class="channel-name">Foro de Anuncios</span>
              </div>

              <div 
                class="channel"
                :class="{ active: showPhonebookBox }"
                @click="togglePhonebookBox"
              >
                <i class="fas fa-phone-alt"></i>
                <span class="channel-name">Directorio Telefónico</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="logout-wrapper">
          <button class="logout-button" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </div>
      
      <div class="chat-main">
        <div v-if="!showSuggestionBox && !showAnnouncementsBox && !showPhonebookBox" class="chat-content">
          <div class="chat-header">
            <h2># {{ getCurrentChannelName() }}</h2>
            <p class="channel-header-description" v-if="getCurrentChannelDescription()">
              {{ getCurrentChannelDescription() }}
            </p>
          </div>
          
          <div class="messages" ref="messagesContainer">
            <div v-for="(message, index) in messages" :key="index" :class="['message', { 'own-message': message.userId === userId }]">
              <div class="message-avatar">{{ getMessageInitials(message) }}</div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">{{ message.author }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text">{{ message.text }}</div>
              </div>
            </div>
          </div>
          
          <div class="message-input-container">
            <input 
              type="text" 
              v-model="newMessage" 
              @keyup.enter="sendMessage"
              placeholder="Escribe un mensaje..." 
            />
            <button class="send-button" @click="sendMessage">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <div v-else-if="showAnnouncementsBox" class="announcements-container">
          <div class="announcements-header">
            <h2>Foro de Anuncios</h2>
            <p class="announcements-description">
              Anuncios importantes de la administración
            </p>
          </div>
          
          <div class="announcements-list">
            <div v-if="announcements.length === 0" class="no-announcements">
              No hay anuncios disponibles en este momento.
            </div>
            <div v-else v-for="announcement in announcements" :key="announcement._id" class="announcement-card">
              <h3 class="announcement-title">{{ announcement.title }}</h3>
              <p class="announcement-content">{{ announcement.content }}</p>
              <div class="announcement-footer">
                <span class="announcement-author">Por: {{ announcement.author.name }}</span>
                <span class="announcement-date">{{ formatDate(announcement.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="showPhonebookBox" class="phonebook-container">
          <div class="phonebook-header">
            <h2>Directorio Telefónico</h2>
            <div class="search-bar">
              <input 
                type="text" 
                v-model="phoneSearch" 
                placeholder="Buscar por nombre o número..." 
                @input="searchDirectory"
              />
              <button class="refresh-button" @click="fetchPhonebook" title="Actualizar directorio">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
            <p class="last-update" v-if="lastUpdate">
              Última actualización: {{ formatDate(lastUpdate) }}
            </p>
          </div>
          
          <div class="phonebook-table-container">
            <table class="phonebook-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Anexo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="2" class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                  </td>
                </tr>
                <tr v-else-if="filteredDirectory.length === 0">
                  <td colspan="2" class="no-results">
                    No se encontraron resultados
                  </td>
                </tr>
                <tr v-else v-for="entry in filteredDirectory" :key="entry.id">
                  <td>{{ entry.name }}</td>
                  <td>{{ entry.extension }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="suggestion-container">
          <div class="suggestion-header">
            <h2>Buzón de Sugerencias Anónimas</h2>
            <p class="suggestion-description">
              Tus sugerencias nos ayudan a mejorar. Todas las sugerencias son anónimas.
            </p>
          </div>
          
          <div class="suggestion-form">
            <textarea 
              v-model="suggestionText" 
              placeholder="Escribe tu sugerencia aquí..."
              rows="6"
            ></textarea>
            <div class="suggestion-actions">
              <button class="cancel-button" @click="toggleSuggestionBox">Cancelar</button>
              <button class="submit-button" @click="submitSuggestion" :disabled="!suggestionText.trim()">
                Enviar Sugerencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'ChatView',
  data() {
    return {
      socket: null,
      user: null, // objeto con _id y name
      channels: [],
      selectedChannel: null,
      messages: [],
      newMessage: '',
      statusInterval: null,
      showSuggestionBox: false,
      showAnnouncementsBox: false,
      showPhonebookBox: false,
      suggestionText: '',
      announcements: [],
      phoneSearch: '',
      directory: [],
      filteredDirectory: [],
      lastUpdate: null,
      loading: false,
    }
  },
  computed: {
    userName() {
      return this.user?.name || 'Usuario';
    }
  },
  mounted() {
    const storedUser = JSON.parse(localStorage.getItem('user'))

    if (!storedUser || !storedUser._id) {
      this.$router.push('/login')
      return
    }

    // Verificar estado del usuario cada minuto
    this.statusInterval = setInterval(this.checkUserStatus, 60000)

    this.user = storedUser
    this.initializeSocketConnection()
    this.fetchMessages()
    this.fetchChannels()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect()
    }
    // Limpiar el intervalo de verificación
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
    }
  },
  methods: {
    initializeSocketConnection() {
      this.socket = io('http://localhost:3000')

      this.socket.on('connect', () => {
        console.log('Conectado al servidor')
        if (this.selectedChannel) {
          this.socket.emit('join_channel', this.selectedChannel)
        }
      })

      this.socket.on('message_history', (messages) => {
        console.log('Recibiendo historial de mensajes:', messages)
        this.messages = messages
        this.$nextTick(this.scrollToBottom)
      })

      this.socket.on('new_message', (message) => {
        this.messages.push(message)
        this.$nextTick(this.scrollToBottom)
      })

      this.socket.on('error', (error) => {
        console.error('Error del servidor:', error.message)
      })
    },

    async fetchMessages() {
      const token = localStorage.getItem('token')

      try {
        const response = await fetch(`http://localhost:3000/api/messages/${this.selectedChannel}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            this.logout();
            return;
          }
          throw new Error('Error al obtener mensajes');
        }

        const data = await response.json();
        this.messages = data.map(msg => ({
          _id: msg._id,
          userId: msg.userId._id,
          author: msg.userId.name,
          text: msg.text,
          timestamp: msg.createdAt
        }));
        
        this.$nextTick(this.scrollToBottom);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      }
    },

    sendMessage() {
      if (!this.newMessage.trim() || !this.selectedChannel) return;

      const messagePayload = {
        channelId: this.selectedChannel,
        text: this.newMessage.trim(),
        userId: this.user._id
      };

      this.socket.emit('send_message', messagePayload);
      this.newMessage = '';
    },

    async selectChannel(channelId) {
      this.selectedChannel = channelId;
      this.messages = []; // Limpiar mensajes anteriores
      if (this.socket) {
        this.socket.emit('join_channel', channelId);
      }
      this.showSuggestionBox = false;
      this.showAnnouncementsBox = false;
      this.showPhonebookBox = false;
    },

    getCurrentChannelName() {
      const channel = this.channels.find(c => c._id === this.selectedChannel)
      return channel ? channel.name : this.selectedChannel
    },

    getCurrentChannelDescription() {
      const channel = this.channels.find(c => c._id === this.selectedChannel)
      return channel ? channel.description : ''
    },

    getUserInitials() {
      if (!this.user?.name) return '?'
      return this.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    },

    getMessageInitials(message) {
      if (!message.author) return '?'
      return message.author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight
      }
    },

    async checkUserStatus() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/check-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const data = await response.json()
          if (data.message.includes('inactivo')) {
            alert('Su cuenta ha sido desactivada. Por favor, contacte al administrador.')
            this.logout()
          }
        }
      } catch (error) {
        console.error('Error al verificar estado:', error)
      }
    },

    async logout() {
      try {
        const token = localStorage.getItem('token');
        
        // Notificar al backend antes de limpiar el token
        if (token) {
          try {
            await fetch('http://localhost:3000/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            // Si falla la llamada al backend, continuamos con el logout local
            console.error('Error al notificar logout al servidor:', error);
          }
        }
      } catch (error) {
        console.error('Error en logout:', error);
      } finally {
        // Limpiar datos locales y desconectar socket
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (this.socket) {
          this.socket.disconnect();
        }
        this.$router.push('/login');
      }
    },

    toggleSuggestionBox() {
      this.showSuggestionBox = !this.showSuggestionBox;
      this.suggestionText = '';
    },
    
    async submitSuggestion() {
      if (!this.suggestionText.trim()) return;
      
      try {
        const token = localStorage.getItem('token');
        console.log('Enviando sugerencia:', this.suggestionText.trim());
        
        const response = await fetch('http://localhost:3000/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: this.suggestionText.trim()
          })
        });

        // Primero verificamos el tipo de contenido de la respuesta
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('La respuesta del servidor no es JSON válido');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al enviar la sugerencia');
        }

        console.log('Respuesta exitosa:', data);
        
        alert('¡Gracias! Tu sugerencia ha sido enviada correctamente.');
        this.suggestionText = '';
        this.showSuggestionBox = false;
      } catch (error) {
        console.error('Error completo:', error);
        alert('Error al enviar la sugerencia. Por favor, intenta nuevamente.');
      }
    },

    toggleAnnouncementsBox() {
      this.showAnnouncementsBox = !this.showAnnouncementsBox;
      this.showSuggestionBox = false;
      this.showPhonebookBox = false;
      if (this.showAnnouncementsBox) {
        this.fetchAnnouncements();
      }
    },

    async fetchAnnouncements() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/announcements', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener anuncios');
        }

        this.announcements = await response.json();
      } catch (error) {
        console.error('Error al cargar anuncios:', error);
      }
    },

    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    async fetchChannels() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/channels', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener canales');
        }

        this.channels = await response.json();
        
        // Seleccionar el primer canal por defecto si no hay ninguno seleccionado
        if (!this.selectedChannel && this.channels.length > 0) {
          this.selectChannel(this.channels[0]._id);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    },

    togglePhonebookBox() {
      this.showPhonebookBox = !this.showPhonebookBox;
      this.showSuggestionBox = false;
      this.showAnnouncementsBox = false;
      if (this.showPhonebookBox) {
        this.fetchPhonebook();
      }
    },

    async fetchPhonebook() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/phonebook', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener el directorio');
        }

        const data = await response.json();
        this.directory = data.entries;
        this.filteredDirectory = [...this.directory];
        this.lastUpdate = new Date();
      } catch (error) {
        console.error('Error al cargar el directorio:', error);
      } finally {
        this.loading = false;
      }
    },

    async searchDirectory() {
      if (!this.phoneSearch.trim()) {
        this.filteredDirectory = [...this.directory];
        return;
      }

      const searchTerm = this.phoneSearch.toLowerCase().trim();
      
      // Búsqueda local por nombre y anexo
      this.filteredDirectory = this.directory.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm) ||
        entry.extension.toString().includes(searchTerm)
      );

      // Si no hay resultados locales, intentamos con el servidor
      if (this.filteredDirectory.length === 0) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/api/phonebook/search?query=${encodeURIComponent(searchTerm)}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Error en la búsqueda');
          }

          const data = await response.json();
          if (data.entries && data.entries.length > 0) {
            this.filteredDirectory = data.entries;
          }
        } catch (error) {
          console.error('Error en la búsqueda:', error);
        }
      }
    },
  }
}
</script>


<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.chat-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  background-color: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

.chat-container {
  display: flex;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Sidebar styles */
.sidebar {
  width: 260px;
  min-width: 260px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-info {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 36px;
  height: 36px;
  background-color: #3498db; /* Azul principal original */
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.user-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channels-section {
  flex: 1;
  overflow-y: auto;
}

.chat-corporativo h3 {
  padding: 15px 20px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.channels-list {
  margin-bottom: 20px;
}

.channel {
  padding: 10px 20px 10px 45px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
}

.channel i {
  position: absolute;
  left: 20px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.channel:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.channel.active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.channel-name {
  font-size: 14px;
}

.otras-opciones h3 {
  margin-top: 10px;
  background-color: rgba(0, 0, 0, 0.1);
}

.logout-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-button {
  width: 100%;
  padding: 10px;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.logout-button i {
  font-size: 14px;
}

/* Chat main area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.98);
  overflow: hidden;
  position: relative;
  height: 100%;
}

.chat-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/background-network.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.15;
  z-index: 0;
}

.chat-main > * {
  position: relative;
  z-index: 1;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chat-header {
  padding: 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  z-index: 2;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.5em;
  color: #2c3e50;  /* Azul oscuro que ya se usa en la app */
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
}

.channel-header-description {
  margin: 5px 0 0 0;
  color: #34495e;  /* Un tono más oscuro que el original para mejor contraste */
  font-size: 0.9em;
  text-align: left;
  padding-left: 2px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px; /* Espacio para el input */
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background-color: #f8f9fa;
  padding: 10px 15px;
  border-radius: 4px;
  max-width: 80%;
  text-align: left;
}

.own-message {
  flex-direction: row-reverse;
}

.own-message .message-avatar {
  margin-right: 0;
  margin-left: 10px;
  background-color: #2ecc71;
}

.own-message .message-content {
  background-color: #e3f2fd;
  text-align: left;
}

.message-header {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.message-author {
  font-weight: bold;
  color: #2c3e50;
}

.message-time {
  color: #999;
}

.message-text {
  word-break: break-word;
  text-align: left;
  color: #333;
}

.message-input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background-color: #ffffff;
  border-top: 1px solid #e1e4e8;
  display: flex;
  gap: 10px;
  z-index: 2;
}

.message-input-container input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  text-align: left;
}

.send-button {
  padding: 12px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.send-button:hover {
  background-color: #2980b9;
}

.mt-4 {
  margin-top: 20px;
}

.suggestion-box {
  color: rgba(255, 255, 255, 0.7);
}

.suggestion-box.active {
  background-color: rgba(255, 255, 255, 0.2); /* Original */
  color: white;
}

.suggestion-box i {
  margin-right: 8px;
}

.suggestion-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.suggestion-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e1e4e8;
}

.suggestion-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.suggestion-description {
  color: #7f8c8d;
  font-size: 14px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e1e4e8;
}

.suggestion-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.suggestion-form textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid #dddfe2;
  border-radius: 8px;
  font-size: 15px;
  resize: vertical;
  min-height: 150px;
  outline: none;
  transition: border-color 0.2s;
}

.suggestion-form textarea:focus {
  border-color: #3498db;
}

.suggestion-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-button, .submit-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: #f1f3f5;
  border: 1px solid #dddfe2;
  color: #2c3e50;
}

.cancel-button:hover {
  background-color: #e9ecef;
}

.submit-button {
  background-color: #3498db; /* Azul principal original */
  border: none;
  color: white;
}

.submit-button:hover {
  background-color: #2980b9; /* Azul oscuro original */
}

.submit-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.announcements-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.announcements-header {
  margin-bottom: 20px;
  text-align: center;
}

.announcements-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.announcements-description {
  color: #666;
  margin-top: 10px;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcement-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.announcement-title {
  font-size: 1.2em;
  color: #2c3e50; /* Azul oscuro original */
  margin-bottom: 10px;
}

.announcement-content {
  color: #2c3e50; /* Azul oscuro original */
  line-height: 1.5;
  margin-bottom: 15px;
}

.announcement-footer {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
}

.no-announcements {
  text-align: center;
  color: #666;
  padding: 40px;
}

.announcements-box {
  color: rgba(255, 255, 255, 0.7);
}

.announcements-box.active {
  background-color: rgba(255, 255, 255, 0.2); /* Original */
  color: white;
}

.suggestion-box:hover, .announcements-box:hover {
  background-color: rgba(255, 255, 255, 0.1); /* Original */
}

.phonebook-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 20px;
  overflow: hidden;
}

.phonebook-header {
  margin-bottom: 20px;
}

.phonebook-header h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.search-bar input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.refresh-button {
  padding: 8px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.refresh-button:hover {
  background-color: #2980b9;
}

.last-update {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.phonebook-table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.phonebook-table {
  width: 100%;
  border-collapse: collapse;
}

.phonebook-table th,
.phonebook-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.phonebook-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.phonebook-table tr:hover {
  background-color: #f5f7fa;
}

.loading-message,
.no-results {
  text-align: center;
  padding: 20px;
  color: #666;
}

.loading-message i {
  margin-right: 8px;
}

.phonebook-box {
  margin-top: 10px;
}
</style>