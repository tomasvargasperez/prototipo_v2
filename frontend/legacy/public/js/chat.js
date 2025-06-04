// frontend/public/js/chat.js
const socket = io();
let currentChannel = 'general';
const userId = localStorage.getItem('userId'); // Asegúrate de enviar esto desde el login

document.querySelectorAll('.channel').forEach(channel => {
  channel.addEventListener('click', () => {
    document.querySelector('.channel.active').classList.remove('active');
    channel.classList.add('active');
    currentChannel = channel.dataset.channel;
    socket.emit('join_channel', currentChannel);
  });
});

document.getElementById('sendButton').addEventListener('click', () => {
  const text = document.getElementById('messageInput').value;
  if (text.trim()) {
    socket.emit('send_message', { 
      channel: currentChannel, 
      text,
      userId 
    });
    document.getElementById('messageInput').value = '';
  }
});

socket.on('new_message', (msg) => {
  const messagesDiv = document.getElementById('messages');
  const time = new Date(msg.timestamp).toLocaleString();

  messagesDiv.innerHTML += `
    <div class="message">
      <strong>${msg.user.name}</strong> <span class="timestamp">${time}</span>: ${msg.text}
    </div>
  `;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('message_history', (messages) => {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = messages.map(msg => `
    <div class="message">
      <strong>${msg.user.name}:</strong> ${msg.text}
    </div>
  `).join('');
});

// ✅ Nuevo: Botón de cerrar sesión
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    // Elimina datos del usuario del almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    // Redirige al login
    window.location.href = '/';
  });
}