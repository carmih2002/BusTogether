// Get bus ID from URL
const pathParts = window.location.pathname.split('/');
const busId = pathParts[pathParts.length - 1];

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const inactiveScreen = document.getElementById('inactive-screen');
const usernameScreen = document.getElementById('username-screen');
const chatScreen = document.getElementById('chat-screen');
const chatNameDisplay = document.getElementById('chat-name-display');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const chatTitle = document.getElementById('chat-title');
const participantCount = document.getElementById('participant-count');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const errorToast = document.getElementById('error-toast');

// State
let socket = null;
let currentChatName = '';
let participants = new Set();

// Initialize
init();

async function init() {
    try {
        // Check chat status
        const response = await fetch(`/api/chat/status/${busId}`);
        const data = await response.json();

        if (data.isActive) {
            // Show username screen
            currentChatName = data.chatName;
            chatNameDisplay.textContent = data.chatName;
            showScreen('username');

            // Initialize socket connection
            initSocket();
        } else {
            // Show inactive screen
            showScreen('inactive');
        }
    } catch (error) {
        console.error('Error checking chat status:', error);
        showError('שגיאה בטעינת הצ\'אט');
        showScreen('inactive');
    }
}

function initSocket() {
    socket = io();

    // Connection events
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showError('החיבור לשרת נותק');
    });

    // Chat events
    socket.on('chat-joined', (data) => {
        console.log('Joined chat:', data);
        chatTitle.textContent = data.chatName;

        // Load existing messages
        data.messages.forEach(msg => {
            addMessage(msg.username, msg.text, msg.timestamp, msg.id);
        });

        // Update participants
        participants = new Set(data.participants.map(p => p.username));
        updateParticipantCount();

        showScreen('chat');
    });

    socket.on('user-joined', (data) => {
        participants.add(data.username);
        updateParticipantCount();
        addSystemMessage(`${data.username} הצטרף לצ'אט`);
    });

    socket.on('user-left', (data) => {
        participants.delete(data.username);
        updateParticipantCount();
        addSystemMessage(`${data.username} עזב את הצ'אט`);
    });

    socket.on('new-message', (data) => {
        addMessage(data.username, data.text, data.timestamp, data.id);
    });

    socket.on('message-deleted', (data) => {
        removeMessage(data.messageId);
    });

    socket.on('chat-closed', (data) => {
        showError(data.message);
        setTimeout(() => {
            location.reload();
        }, 3000);
    });

    socket.on('kicked', (data) => {
        showError(data.reason);
        setTimeout(() => {
            location.reload();
        }, 3000);
    });

    socket.on('error', (data) => {
        showError(data.message);
    });

    socket.on('report-received', () => {
        showError('הדיווח נשלח בהצלחה');
    });
}

// Join chat
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinChat();
    }
});

function joinChat() {
    const username = usernameInput.value.trim();

    if (!username) {
        showError('אנא הכנס שם משתמש');
        return;
    }

    if (username.length < 2 || username.length > 20) {
        showError('שם המשתמש חייב להיות בין 2-20 תווים');
        return;
    }

    socket.emit('join-chat', { busId, username });
}

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    if (text.length > 500) {
        showError('ההודעה ארוכה מדי (מקסימום 500 תווים)');
        return;
    }

    socket.emit('send-message', { text });
    messageInput.value = '';
}

// Report message
function reportMessage(messageId) {
    if (confirm('האם אתה בטוח שברצונך לדווח על הודעה זו?')) {
        socket.emit('report-message', { messageId });
    }
}

// UI Functions
function showScreen(screenName) {
    loadingScreen.classList.add('hidden');
    inactiveScreen.classList.add('hidden');
    usernameScreen.classList.add('hidden');
    chatScreen.classList.add('hidden');

    switch (screenName) {
        case 'loading':
            loadingScreen.classList.remove('hidden');
            break;
        case 'inactive':
            inactiveScreen.classList.remove('hidden');
            break;
        case 'username':
            usernameScreen.classList.remove('hidden');
            usernameInput.focus();
            break;
        case 'chat':
            chatScreen.classList.remove('hidden');
            messageInput.focus();
            scrollToBottom();
            break;
    }
}

function addMessage(username, text, timestamp, messageId) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.messageId = messageId;

    const time = new Date(timestamp).toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
    <div class="message-header">
      <span class="message-username">${escapeHtml(username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${escapeHtml(text)}</div>
    <div class="message-actions">
      <button class="report-btn" onclick="reportMessage('${messageId}')">🚩 דווח</button>
    </div>
  `;

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function removeMessage(messageId) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'scale(0.8)';
        setTimeout(() => messageDiv.remove(), 300);
    }
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function updateParticipantCount() {
    participantCount.textContent = `${participants.size} משתתפים`;
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

function showError(message) {
    errorToast.textContent = message;
    errorToast.classList.remove('hidden');

    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
