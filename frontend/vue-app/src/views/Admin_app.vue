<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="sidebar">
        <div class="user-info">
          <div class="avatar">A</div>
          <div class="user-name">Administrador</div>
        </div>
        
        <div class="channels-section">
          <h3>Panel Admin</h3>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'dashboard' }"
            @click="setActiveSection('dashboard')"
          >
            <span class="channel-name">
              <i class="fas fa-chart-line"></i> Dashboard
            </span>
          </div>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'usuarios' }"
            @click="setActiveSection('usuarios')"
          >
            <span class="channel-name">
              <i class="fas fa-users"></i> Usuarios
            </span>
          </div>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'configuracion' }"
            @click="setActiveSection('configuracion')"
          >
            <span class="channel-name">
              <i class="fas fa-cogs"></i> Canales
            </span>
          </div>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'anuncios' }"
            @click="setActiveSection('anuncios')"
          >
            <span class="channel-name">
              <i class="fas fa-bullhorn"></i> Foro de Anuncios
            </span>
          </div>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'sugerencias' }"
            @click="setActiveSection('sugerencias')"
          >
            <span class="channel-name">
              <i class="fas fa-lightbulb"></i> Sugerencias Anónimas
            </span>
          </div>
          <div 
            class="channel" 
            :class="{ active: activeSection === 'directorio' }"
            @click="setActiveSection('directorio')"
          >
            <span class="channel-name">
              <i class="fas fa-phone-alt"></i> Directorio Telefónico
            </span>
          </div>
        </div>
        
        <div class="logout-wrapper">
          <button class="logout-button" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-header">
          <h2>{{ getSectionTitle() }}</h2>
        </div>
        
        <div class="admin-content">
          <!-- Dashboard Section -->
          <div v-if="activeSection === 'dashboard'" class="dashboard-container">
            <div class="dashboard-grid">
              <!-- Tarjetas de resumen -->
              <div class="summary-cards">
                <div class="summary-card">
                  <div class="card-icon users">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="card-info">
                    <h3>{{ totalUsers }}</h3>
                    <p>Usuarios Totales</p>
                  </div>
                </div>
                
                <div class="summary-card">
                  <div class="card-icon channels">
                    <i class="fas fa-comments"></i>
                  </div>
                  <div class="card-info">
                    <h3>{{ totalChannels }}</h3>
                    <p>Canales Activos</p>
                  </div>
                </div>
                
                <div class="summary-card">
                  <div class="card-icon messages">
                    <i class="fas fa-envelope"></i>
                  </div>
                  <div class="card-info">
                    <h3>{{ totalMessages }}</h3>
                    <p>Mensajes Enviados</p>
                  </div>
                </div>
                
                <div class="summary-card">
                  <div class="card-icon connections">
                    <i class="fas fa-plug"></i>
                  </div>
                  <div class="card-info">
                    <h3>{{ activeConnections }}</h3>
                    <p>Conexiones Activas</p>
                  </div>
                </div>
              </div>

              <!-- Gráficos -->
              <div class="charts-grid">
                <!-- Gráfico de Actividad de Canales -->
                <div class="chart-card">
                  <h3>Actividad por Canal</h3>
                  <div class="chart-container">
                    <canvas ref="channelActivityChart"></canvas>
                  </div>
                </div>

                <!-- Gráfico de Usuarios Activos -->
                <div class="chart-card">
                  <h3>Usuarios Activos (Últimos 7 días)</h3>
                  <div class="chart-container">
                    <canvas ref="userActivityChart"></canvas>
                  </div>
                </div>

                <!-- Gráfico de Conexiones -->
                <div class="chart-card wide">
                  <h3>Conexiones por Hora</h3>
                  <div class="chart-container">
                    <canvas ref="connectionsChart"></canvas>
                  </div>
                </div>

                <!-- Top Usuarios -->
                <div class="stats-card">
                  <h3>Top Usuarios Activos</h3>
                  <div class="top-users-list">
                    <div v-for="user in topUsers" :key="user.id" class="top-user-item">
                      <div class="user-rank-info">
                        <span class="user-rank">{{ user.rank }}</span>
                        <span class="user-name">{{ user.name }}</span>
                      </div>
                      <span class="user-messages">{{ user.messages }} mensajes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Users Section -->
          <div v-if="activeSection === 'usuarios'" class="users-section">
            <div class="section-header">
              <h3>Gestión de Usuarios</h3>
              <button class="create-btn" @click="openCreateModal">
                <i class="fas fa-plus"></i> Crear Usuario
              </button>
            </div>
            <div class="table-container">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user._id">
                    <td>{{ user._id }}</td>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.role || 'Usuario' }}</td>
                    <td>
                      <span :class="['status-badge', user.active ? 'active' : 'inactive']">
                        {{ user.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button class="action-btn edit" @click="openEditModal(user)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn delete" @click="deleteUser(user._id)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Configuration Section -->
          <div v-if="activeSection === 'configuracion'" class="channels-management">
            <div class="section-header">
              <h3>Gestión de Canales</h3>
              <button class="create-btn" @click="openCreateChannelModal">
                <i class="fas fa-plus"></i> Crear Canal
              </button>
            </div>

            <div class="channels-list">
              <div v-for="channel in channels" :key="channel._id" class="channel-card">
                <div class="channel-header">
                  <h4>{{ channel.name }}</h4>
                  <div class="channel-actions">
                    <button class="action-btn edit" @click="openEditChannelModal(channel)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" @click="deleteChannel(channel._id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <p class="channel-description">{{ channel.description || 'Sin descripción' }}</p>
                <div class="channel-info">
                  <span class="channel-visibility">
                    <i :class="['fas', channel.isPublic ? 'fa-globe' : 'fa-lock']"></i>
                    {{ channel.isPublic ? 'Público' : 'Privado' }}
                  </span>
                  <span class="channel-users">
                    <i class="fas fa-users"></i>
                    {{ channel.allowedUsers ? channel.allowedUsers.length : 0 }} usuarios con acceso
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Announcements Section -->
          <div v-if="activeSection === 'anuncios'" class="announcements-section">
            <div class="section-header">
              <h3>Foro de Anuncios</h3>
              <button class="create-btn" @click="createAnnouncement">
                <i class="fas fa-plus"></i> Nuevo Anuncio
              </button>
            </div>
            
            <!-- Formulario de nuevo anuncio -->
            <div class="announcement-form">
              <div class="form-group">
                <label>Título:</label>
                <input 
                  type="text" 
                  v-model="newAnnouncement.title" 
                  placeholder="Título del anuncio"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>Contenido:</label>
                <textarea 
                  v-model="newAnnouncement.content" 
                  placeholder="Contenido del anuncio"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
              <button 
                class="create-btn" 
                @click="createAnnouncement"
                :disabled="!newAnnouncement.title || !newAnnouncement.content"
              >
                Publicar Anuncio
              </button>
            </div>

            <!-- Lista de anuncios existentes -->
            <div class="announcements-list">
              <h4>Anuncios Publicados</h4>
              <div v-if="announcements.length === 0" class="no-announcements">
                No hay anuncios publicados.
              </div>
              <div v-else class="announcement-cards">
                <div v-for="announcement in announcements" :key="announcement._id" class="announcement-card">
                  <div class="announcement-header">
                    <h5>{{ announcement.title }}</h5>
                    <button class="delete-btn" @click="deleteAnnouncement(announcement._id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <p class="announcement-content">{{ announcement.content }}</p>
                  <div class="announcement-footer">
                    <span>Por: {{ announcement.author.name }}</span>
                    <span>{{ formatDate(announcement.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Nueva sección para Directorio Telefónico -->
          <div v-if="activeSection === 'directorio'" class="directory-section">
            <div class="section-header">
              <h3>Directorio Telefónico</h3>
              <button class="refresh-btn" @click="refreshDirectory">
                <i class="fas fa-sync-alt"></i> Actualizar
              </button>
            </div>

            <div class="last-update-info" v-if="lastDirectoryUpdate">
              Última actualización: {{ lastDirectoryUpdate }}
            </div>

            <div class="directory-search">
              <div class="search-input">
                <input 
                  type="text" 
                  v-model="directorySearch" 
                  placeholder="Buscar por nombre o anexo..."
                  @input="searchDirectory"
                >
                <i class="fas fa-search"></i>
              </div>
            </div>

            <div class="table-container">
              <table class="directory-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Anexo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!directoryContacts.length">
                    <td colspan="2" class="text-center">
                      <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando directorio...
                      </div>
                    </td>
                  </tr>
                  <tr v-else-if="!filteredDirectory.length">
                    <td colspan="2" class="text-center">
                      No se encontraron resultados
                    </td>
                  </tr>
                  <tr v-for="contact in filteredDirectory" :key="contact.id">
                    <td>{{ contact.name }}</td>
                    <td>{{ contact.extension }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Suggestions Section -->
          <div v-if="activeSection === 'sugerencias'" class="suggestions-section">
            <div class="section-header">
              <h3>Sugerencias Anónimas</h3>
              <div class="filter-controls">
                <select v-model="suggestionFilter" class="filter-select">
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="reviewed">Revisadas</option>
                  <option value="implemented">Implementadas</option>
                </select>
              </div>
            </div>

            <div class="suggestions-container">
              <div v-if="filteredSuggestions.length === 0" class="no-suggestions">
                No hay sugerencias disponibles
              </div>
              <div v-else v-for="suggestion in filteredSuggestions" 
                   :key="suggestion._id" 
                   class="suggestion-card">
                <div class="suggestion-content">
                  <p>{{ suggestion.content }}</p>
                </div>
                <div class="suggestion-footer">
                  <span class="suggestion-date">{{ formatDate(suggestion.timestamp) }}</span>
                  <div class="suggestion-status">
                    <select 
                      v-model="suggestion.status"
                      @change="updateSuggestionStatus(suggestion._id, suggestion.status)"
                      :class="['status-select', suggestion.status]"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="reviewed">Revisada</option>
                      <option value="implemented">Implementada</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Editar Usuario</h2>
        <form @submit.prevent="updateUser">
          <div class="form-group">
            <label>Nombre:</label>
            <input type="text" v-model="editingUser.name" required>
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="editingUser.email" required>
          </div>
          <div class="form-group">
            <label>Estado:</label>
            <select v-model="editingUser.active">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
          <div class="form-group">
            <label>Rol:</label>
            <select v-model="editingUser.role">
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <!-- Nueva sección para cambio de contraseña -->
          <div class="password-section">
            <h3>Cambiar Contraseña</h3>
            <div class="form-group">
              <label>Nueva Contraseña:</label>
              <div class="password-input">
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="newPassword" 
                  placeholder="Dejar vacío para mantener la actual"
                >
                <button 
                  type="button" 
                  class="toggle-password" 
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            <div class="form-group" v-if="newPassword">
              <label>Confirmar Contraseña:</label>
              <div class="password-input">
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="confirmPassword"
                  placeholder="Confirmar nueva contraseña"
                >
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="save-btn">Guardar</button>
            <button type="button" class="cancel-btn" @click="closeEditModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Creación de Usuario -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Crear Nuevo Usuario</h2>
        <form @submit.prevent="createUser">
          <div class="form-group">
            <label>Nombre:</label>
            <input type="text" v-model="newUser.name" required>
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="newUser.email" required>
          </div>
          <div class="form-group">
            <label>Contraseña:</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="newUser.password" 
                required
                minlength="6"
              >
              <button 
                type="button" 
                class="toggle-password" 
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Rol:</label>
            <select v-model="newUser.role">
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estado:</label>
            <select v-model="newUser.active">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Crear Usuario</button>
            <button type="button" class="cancel-btn" @click="closeCreateModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Creación/Edición de Canal -->
    <div v-if="showChannelModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ editingChannel ? 'Editar Canal' : 'Crear Nuevo Canal' }}</h2>
        <form @submit.prevent="saveChannel">
          <div class="form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              v-model="channelForm.name" 
              required
              placeholder="Nombre del canal"
            >
          </div>
          <div class="form-group">
            <label>Descripción:</label>
            <textarea 
              v-model="channelForm.description" 
              placeholder="Descripción del canal"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="channelForm.isPublic"
              >
              Canal público
            </label>
          </div>
          <div class="form-group" v-if="!channelForm.isPublic">
            <label>Usuarios con acceso:</label>
            <div class="users-select">
              <div v-for="user in users" :key="user._id" class="user-checkbox">
                <label>
                  <input 
                    type="checkbox" 
                    :value="user._id"
                    v-model="channelForm.allowedUsers"
                  >
                  <span>
                    {{ user.name }}
                    <span class="user-email">({{ user.email }})</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">
              {{ editingChannel ? 'Guardar Cambios' : 'Crear Canal' }}
            </button>
            <button type="button" class="cancel-btn" @click="closeChannelModal">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';
import io from 'socket.io-client';

export default {
  name: 'AdminApp',
  data() {
    return {
      socket: null,
      activeSection: 'dashboard',
      users: [],
      channels: [],
      showEditModal: false,
      editingUser: null,
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      showCreateModal: false,
      showChannelModal: false,
      editingChannel: null,
      channelForm: {
        name: '',
        description: '',
        isPublic: false,
        allowedUsers: []
      },
      newUser: {
        name: '',
        email: '',
        password: '',
        role: 'user',
        active: true
      },
      announcements: [],
      newAnnouncement: {
        title: '',
        content: ''
      },
      totalUsers: 0,
      totalChannels: 0,
      totalMessages: 0,
      activeConnections: 0,
      topUsers: [],
      channelActivityChart: null,
      userActivityChart: null,
      connectionsChart: null,
      suggestionFilter: 'all',
      filteredSuggestions: [],
      dashboardData: null,
      directorySearch: '',
      directoryContacts: [],
      lastDirectoryUpdate: null,
      filteredDirectory: [],
    }
  },
  methods: {
    setActiveSection(section) {
      console.log('Cambiando a sección:', section);
      // Primero cambiamos la sección activa
      this.activeSection = section;
    },
    
    async loadSectionData(section) {
      try {
        console.log('Cargando datos para sección:', section);
        switch (section) {
          case 'dashboard':
            await this.fetchDashboardData();
            break;
          case 'usuarios':
            await this.fetchUsers();
            break;
          case 'configuracion':
            await this.fetchChannels();
            break;
          case 'anuncios':
            await this.fetchAnnouncements();
            break;
          case 'sugerencias':
            await this.fetchSuggestions();
            break;
          case 'directorio':
            await this.refreshDirectory();
            break;
        }
      } catch (error) {
        console.error('Error al cargar datos de la sección:', error);
      }
    },
    getSectionTitle() {
      const titles = {
        dashboard: 'Panel de Control',
        usuarios: 'Gestión de Usuarios',
        configuracion: 'Configuración',
        anuncios: 'Foro de Anuncios',
        sugerencias: 'Sugerencias Anónimas',
        directorio: 'Directorio Telefónico'
      }
      return titles[this.activeSection] || 'Panel de Administración'
    },
    async fetchUsers() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          this.users = await response.json()
        } else {
          console.error('Error al obtener usuarios')
        }
      } catch (error) {
        console.error('Error:', error)
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
        // Limpiar datos locales
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login');
      }
    },
    openEditModal(user) {
      this.editingUser = { ...user };
      this.newPassword = '';
      this.confirmPassword = '';
      this.showPassword = false;
      this.showEditModal = true;
    },
    closeEditModal() {
      this.showEditModal = false;
      this.editingUser = null;
      this.newPassword = '';
      this.confirmPassword = '';
      this.showPassword = false;
    },
    async updateUser() {
      // Validar contraseñas si se está cambiando
      if (this.newPassword) {
        if (this.newPassword !== this.confirmPassword) {
          alert('Las contraseñas no coinciden');
          return;
        }
        if (this.newPassword.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres');
          return;
        }
      }

      try {
        const token = localStorage.getItem('token');
        const updateData = {
          name: this.editingUser.name,
          email: this.editingUser.email,
          role: this.editingUser.role,
          active: this.editingUser.active
        };

        // Incluir contraseña solo si se está cambiando
        if (this.newPassword) {
          updateData.password = this.newPassword;
        }

        const response = await fetch(`http://localhost:3000/api/users/${this.editingUser._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          await this.fetchUsers();
          this.closeEditModal();
          alert('Usuario actualizado correctamente');
        } else {
          const error = await response.json();
          alert(error.message || 'Error al actualizar usuario');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar usuario');
      }
    },
    async deleteUser(userId) {
      if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Actualizar la lista de usuarios
            await this.fetchUsers();
            alert('Usuario eliminado correctamente');
          } else {
            alert('Error al eliminar usuario');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error al eliminar usuario');
        }
      }
    },
    openCreateModal() {
      this.newUser = {
        name: '',
        email: '',
        password: '',
        role: 'user',
        active: true
      };
      this.showCreateModal = true;
      this.showPassword = false;
    },
    closeCreateModal() {
      this.showCreateModal = false;
      this.newUser = {
        name: '',
        email: '',
        password: '',
        role: 'user',
        active: true
      };
      this.showPassword = false;
    },
    async createUser() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.newUser)
        });

        if (response.ok) {
          await this.fetchUsers();
          this.closeCreateModal();
          alert('Usuario creado correctamente');
        } else {
          const error = await response.json();
          alert(error.message || 'Error al crear usuario');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al crear usuario');
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
        alert('Error al cargar los anuncios');
      }
    },
    async createAnnouncement() {
      if (!this.newAnnouncement.title.trim() || !this.newAnnouncement.content.trim()) {
        alert('Por favor, complete todos los campos');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.newAnnouncement)
        });

        if (!response.ok) {
          throw new Error('Error al crear el anuncio');
        }

        const result = await response.json();
        this.announcements.unshift(result.announcement);
        this.newAnnouncement = { title: '', content: '' };
        alert('Anuncio creado exitosamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el anuncio');
      }
    },
    async deleteAnnouncement(id) {
      if (!confirm('¿Está seguro de que desea eliminar este anuncio?')) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al eliminar anuncio');
        }

        this.announcements = this.announcements.filter(a => a._id !== id);
        alert('Anuncio eliminado exitosamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el anuncio');
      }
    },
    async fetchChannels() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/channels/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener canales');
        }

        this.channels = await response.json();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los canales');
      }
    },
    openCreateChannelModal() {
      this.editingChannel = null;
      this.channelForm = {
        name: '',
        description: '',
        isPublic: false,
        allowedUsers: []
      };
      this.showChannelModal = true;
    },
    openEditChannelModal(channel) {
      this.editingChannel = channel;
      this.channelForm = {
        name: channel.name,
        description: channel.description || '',
        isPublic: channel.isPublic,
        allowedUsers: Array.isArray(channel.allowedUsers) 
          ? channel.allowedUsers.map(user => typeof user === 'object' ? user._id : user)
          : []
      };
      // Asegurarse de que los usuarios estén cargados
      if (!this.users.length) {
        this.fetchUsers();
      }
      this.showChannelModal = true;
    },
    closeChannelModal() {
      this.showChannelModal = false;
      this.editingChannel = null;
      this.channelForm = {
        name: '',
        description: '',
        isPublic: false,
        allowedUsers: []
      };
    },
    async saveChannel() {
      try {
        const token = localStorage.getItem('token');
        const url = this.editingChannel 
          ? `http://localhost:3000/api/channels/${this.editingChannel._id}`
          : 'http://localhost:3000/api/channels';
        
        const response = await fetch(url, {
          method: this.editingChannel ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.channelForm)
        });

        if (!response.ok) {
          throw new Error('Error al guardar el canal');
        }

        await this.fetchChannels();
        this.closeChannelModal();
        alert(this.editingChannel ? 'Canal actualizado correctamente' : 'Canal creado correctamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el canal');
      }
    },
    async deleteChannel(channelId) {
      if (!confirm('¿Está seguro de que desea eliminar este canal?')) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/channels/${channelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el canal');
        }

        await this.fetchChannels();
        alert('Canal eliminado correctamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el canal');
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
    async fetchDashboardData() {
      try {
        console.log('📊 Iniciando solicitud de datos del dashboard...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('❌ No se encontró el token de autenticación');
          return;
        }

        console.log('🔑 Token encontrado, realizando solicitud...');
        const response = await fetch('http://localhost:3000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Error en la respuesta:', errorData);
          throw new Error(errorData.message || 'Error al obtener datos del dashboard');
        }

        console.log('✅ Datos recibidos correctamente');
        const data = await response.json();
        
        // Guardar los datos en una propiedad del componente
        this.dashboardData = data;
        
        // Actualizar el estado
        this.totalUsers = data.totalUsers || 0;
        this.totalChannels = data.totalChannels || 0;
        this.totalMessages = data.totalMessages || 0;
        this.activeConnections = data.activeConnections || 0;
        this.topUsers = data.topUsers || [];

        // Esperar a que Vue actualice el DOM
        await this.$nextTick();
        
        // Esperar un poco más para asegurar que los canvas estén disponibles
        setTimeout(() => {
          if (this.activeSection === 'dashboard') {
            this.initializeCharts(data);
          }
        }, 100);
      } catch (error) {
        console.error('❌ Error al cargar datos del dashboard:', error);
        alert('Error al cargar los datos del dashboard. Por favor, intente nuevamente.');
      }
    },
    destroyCharts() {
      console.log('Destruyendo gráficos...');
      if (this.channelActivityChart) {
        this.channelActivityChart.destroy();
        this.channelActivityChart = null;
      }
      if (this.userActivityChart) {
        this.userActivityChart.destroy();
        this.userActivityChart = null;
      }
      if (this.connectionsChart) {
        this.connectionsChart.destroy();
        this.connectionsChart = null;
      }
    },
    initializeCharts(data) {
      console.log('🎨 Iniciando inicialización de gráficos...');
      
      // Asegurarse de que estamos en la sección dashboard
      if (this.activeSection !== 'dashboard') {
        console.log('❌ No estamos en la sección dashboard, cancelando inicialización de gráficos');
        return;
      }

      // Configuración común
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      };

      try {
        // Gráfico de Actividad por Canal
        const channelCtx = this.$refs.channelActivityChart?.getContext('2d');
        if (channelCtx) {
          console.log('📊 Creando gráfico de actividad por canal...');
          this.channelActivityChart = new Chart(channelCtx, {
            type: 'bar',
            data: {
              labels: data.channelActivity.map(c => c.name),
              datasets: [{
                label: 'Mensajes por Canal',
                data: data.channelActivity.map(c => c.messages),
                backgroundColor: '#8e44ad',
                borderRadius: 5
              }]
            },
            options: {
              ...chartOptions,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }
          });
        }

        // Gráfico de Usuarios Activos
        const userCtx = this.$refs.userActivityChart?.getContext('2d');
        if (userCtx) {
          console.log('📊 Creando gráfico de usuarios activos...');
          this.userActivityChart = new Chart(userCtx, {
            type: 'line',
            data: {
              labels: data.userActivity.map(d => d.date),
              datasets: [{
                label: 'Mensajes por Día',
                data: data.userActivity.map(d => d.count),
                borderColor: '#2ecc71',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(46, 204, 113, 0.1)'
              }]
            },
            options: chartOptions
          });
        }

        // Gráfico de Conexiones
        const connectionsCtx = this.$refs.connectionsChart?.getContext('2d');
        if (connectionsCtx) {
          console.log('📊 Creando gráfico de conexiones...');
          this.connectionsChart = new Chart(connectionsCtx, {
            type: 'line',
            data: {
              labels: data.connections.map(c => c.hour),
              datasets: [{
                label: 'Conexiones',
                data: data.connections.map(c => c.count),
                borderColor: '#3498db',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
              }]
            },
            options: {
              ...chartOptions,
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }
          });
        }
        
        console.log('✅ Inicialización de gráficos completada');
      } catch (error) {
        console.error('❌ Error al inicializar los gráficos:', error);
      }
    },
    async fetchSuggestions() {
      try {
        console.log('Iniciando carga de sugerencias');
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        const response = await fetch('http://localhost:3000/api/suggestions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status}`);
        }

        const data = await response.json();
        console.log('Sugerencias recibidas:', data);
        
        // Asegurarse de que data sea un array
        this.filteredSuggestions = Array.isArray(data) ? data : [];
        
        // Aplicar el filtro actual si existe
        if (this.suggestionFilter !== 'all') {
          this.filteredSuggestions = this.filteredSuggestions.filter(
            s => s.status === this.suggestionFilter
          );
        }
        
        console.log('Sugerencias filtradas:', this.filteredSuggestions);
      } catch (error) {
        console.error('Error en fetchSuggestions:', error);
        this.filteredSuggestions = [];
      }
    },
    async updateSuggestionStatus(id, status) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/suggestions/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el estado de la sugerencia');
        }

        await this.fetchSuggestions();
        alert('Estado de la sugerencia actualizado correctamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado de la sugerencia');
      }
    },
    initializeSocket() {
      this.socket = io('http://localhost:3000');
      
      // Escuchar eventos de actualización del dashboard
      this.socket.on('dashboard_update', () => {
        console.log('🔄 Recibido evento de actualización del dashboard');
        if (this.activeSection === 'dashboard') {
          this.fetchDashboardData();
        }
      });
    },
    async refreshDirectory() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/phonebook', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Formatear los datos para la tabla
          this.directoryContacts = data.entries.map((entry, index) => ({
            id: index + 1,
            number: index + 1,
            name: entry.name,
            extension: entry.extension
          }));
          this.filteredDirectory = [...this.directoryContacts];
          this.lastDirectoryUpdate = new Date().toLocaleString();
        } else {
          console.error('Error al obtener el directorio');
          alert('Error al obtener el directorio telefónico');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
      }
    },
    searchDirectory() {
      if (!this.directorySearch) {
        this.filteredDirectory = [...this.directoryContacts];
        return;
      }

      const searchTerm = this.directorySearch.toLowerCase().trim();
      this.filteredDirectory = this.directoryContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.extension.toString().includes(searchTerm)
      );
    },
  },
  watch: {
    activeSection: {
      immediate: true,
      handler(newSection, oldSection) {
        console.log('Watch - Nueva sección activa:', newSection);
        // Limpiar formularios
        this.newAnnouncement = { title: '', content: '' };
        this.closeChannelModal();
        this.closeEditModal();
        this.closeCreateModal();
        
        // Solo destruir los gráficos si salimos del dashboard
        if (oldSection === 'dashboard') {
          this.destroyCharts();
        }
        
        // Cargar datos de la nueva sección
        this.loadSectionData(newSection);
      }
    },
    'channelForm.isPublic'(newValue) {
      // Si el canal se vuelve privado, asegurarse de que los usuarios estén cargados
      if (!newValue && !this.users.length) {
        this.fetchUsers();
      }
    }
  },
  mounted() {
    console.log('🔄 Componente Admin_app montado');
    
    // Verificar si el usuario es administrador
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      console.error('❌ Usuario no autorizado');
      this.$router.push('/chat');
      return;
    }

    console.log('👤 Usuario autenticado como admin');
    
    // Inicializar socket
    this.initializeSocket();
    
    // Si estamos en la sección dashboard, cargar los datos
    if (this.activeSection === 'dashboard') {
      console.log('📊 Cargando datos del dashboard...');
      this.fetchDashboardData();
    }
  },
  created() {
    // Establecer el dashboard como sección activa por defecto
    this.activeSection = 'dashboard';
  },
  beforeDestroy() {
    // Desconectar socket y destruir gráficos
    if (this.socket) {
      this.socket.disconnect();
    }
    this.destroyCharts();
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
  background-color: #4a235a;
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
  background-color: #8e44ad;
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
  padding: 15px 0;
  overflow-y: auto;
}

.channels-section h3 {
  padding: 0 20px;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.channel {
  padding: 8px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.channel:hover {
  background-color: rgba(142, 68, 173, 0.2);
  padding-left: 25px;
}

.channel.active {
  background-color: rgba(142, 68, 173, 0.4);
  color: white;
  padding-left: 25px;
}

.channel-name {
  font-weight: 500;
}

.channel-name i {
  margin-right: 8px;
  width: 16px;
  text-align: center;
}

.logout-wrapper {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-button {
  width: 100%;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.logout-button:hover {
  background-color: rgba(142, 68, 173, 0.3);
}

/* Chat main area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.98);
  overflow: hidden;
  min-width: 0;
  position: relative;
}

.chat-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/background-network_2.jpg');
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

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
}

.chat-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #4a235a;
  margin: 0;
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  background-color: transparent;
}

/* Nuevos estilos para la tabla de usuarios */
.users-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  min-height: 40px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
  line-height: 1.4;
}

.create-btn {
  background-color: #8e44ad;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #703688;
}

.create-btn i {
  font-size: 14px;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.users-table th,
.users-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8f9fa;
  color: #4a235a;
  font-weight: 600;
}

.users-table tr:hover {
  background-color: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.action-btn.edit:hover {
  color: #8e44ad;
}

.action-btn.delete:hover {
  color: #e74c3c;
}

/* Estilos para el modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  color: #4a235a;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn {
  background-color: #8e44ad;
  color: white;
}

.save-btn:hover {
  background-color: #703688;
}

.cancel-btn {
  background-color: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background-color: #7f8c8d;
}

.password-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.password-section h3 {
  color: #4a235a;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
}

.toggle-password:hover {
  color: #4a235a;
}

.announcements-section {
  padding: 20px;
}

.announcement-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.announcement-form h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
}

.announcements-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.announcements-list h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.announcement-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.announcement-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.announcement-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.delete-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 5px;
}

.delete-btn:hover {
  color: #c0392b;
}

.announcement-content {
  color: #2c3e50;
  margin-bottom: 10px;
  line-height: 1.5;
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
  padding: 20px;
}

.channels-management {
  padding: 20px;
}

.channels-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.channel-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.channel-header h4 {
  margin: 0;
  color: #4a235a;
}

.channel-actions {
  display: flex;
  gap: 8px;
}

.channel-description {
  color: #666;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.channel-info {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
}

.channel-visibility,
.channel-users {
  display: flex;
  align-items: center;
  gap: 5px;
}

.users-select {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-top: 5px;
}

.user-checkbox {
  margin-bottom: 8px;
  padding: 4px 0;
  display: flex;
  align-items: center;
}

.user-checkbox label {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  padding: 4px 8px;
}

.user-checkbox input[type="checkbox"] {
  margin-right: 12px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.user-checkbox span {
  margin-left: 8px;
  color: #666;
  font-size: 0.9em;
}

.user-checkbox:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.user-checkbox label span {
  display: flex;
  flex-direction: column;
}

.user-checkbox label span .user-email {
  font-size: 0.8em;
  color: #999;
  margin-top: 2px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.dashboard-container {
  padding: 20px;
  background-color: transparent;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 2;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 2;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  position: relative;
  z-index: 2;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.card-icon.users { background-color: #8e44ad; }
.card-icon.channels { background-color: #2ecc71; }
.card-icon.messages { background-color: #e74c3c; }
.card-icon.connections { background-color: #3498db; }

.card-info h3 {
  font-size: 24px;
  margin: 0;
  color: #2c3e50;
}

.card-info p {
  margin: 4px 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  position: relative;
  z-index: 2;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.chart-card h3 {
  margin: 0 0 20px;
  color: #2c3e50;
  font-size: 16px;
  flex-shrink: 0;
}

.chart-card .chart-container {
  flex: 1;
  position: relative;
  min-height: 200px;
}

.chart-card canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.chart-card.wide {
  grid-column: span 2;
  height: 350px;
}

.chart-card.wide .chart-container {
  min-height: 250px;
}

.top-users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-rank-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-rank {
  width: 24px;
  height: 24px;
  background: #8e44ad;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.user-messages {
  color: #7f8c8d;
  font-size: 14px;
}

.suggestions-section {
  padding: 20px;
}

.filter-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-card {
  background: white;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-content {
  color: #2c3e50;
}

.suggestion-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-date {
  color: #666;
  font-size: 0.9em;
}

.suggestion-status {
  display: flex;
  gap: 5px;
}

.status-select {
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.status-select.pending {
  background-color: #ffebee;
  color: #c62828;
}

.status-select.reviewed {
  background-color: #fff9c4;
  color: #f57f17;
}

.status-select.implemented {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.no-suggestions {
  text-align: center;
  color: #666;
  padding: 20px;
}

/* Estilos para el Directorio Telefónico */
.directory-section {
  padding: 20px;
}

.last-update-info {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px 15px;
  border-radius: 4px;
  margin: 10px 0;
  font-size: 0.9em;
}

.directory-search {
  margin: 20px 0;
}

.search-input {
  position: relative;
  max-width: 400px;
}

.search-input input {
  width: 100%;
  padding: 10px 35px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input i {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.directory-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.directory-table th,
.directory-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.directory-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.directory-table tr:hover {
  background-color: #f8f9fa;
}

.refresh-btn {
  background-color: #4a235a;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: #6b3483;
}

.refresh-btn i {
  font-size: 14px;
}

.loading-message {
  padding: 20px;
  text-align: center;
  color: #666;
}

.loading-message i {
  margin-right: 10px;
  color: #4a235a;
}

.text-center {
  text-align: center;
}
</style> 