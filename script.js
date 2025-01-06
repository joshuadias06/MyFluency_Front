// Variáveis globais
let recognition;
let isRecording = false;
let messages = []; // Armazena mensagens enviadas/recebidas
let currentMessageInput; // Campo de entrada de mensagens
window.suggestionsData = []; // Armazena sugestões
window.correctionsData = []; // Armazena correções

// Função para enviar mensagem ao backend e processar a resposta
async function sendMessage() {
    const message = currentMessageInput.value.trim();
    if (!message) return;

    // Adiciona mensagem do usuário ao chat
    messages.push({ text: message, sender: 'user' });
    updateChatWindow();

    // Mensagem temporária enquanto aguarda a resposta
    messages.push({ text: 'Bot: Aguardando resposta...', sender: 'bot', temporary: true });
    updateChatWindow();

    try {
        // Envia a mensagem ao backend
        const response = await sendToBackend(message);

        // Remove a mensagem temporária
        messages = messages.filter(msg => !msg.temporary);

        if (response.error) {
            messages.push({ text: `Bot: ${response.error}`, sender: 'bot' });
        } else {
            messages.push({ text: `Bot: ${response.response}`, sender: 'bot' });
            window.suggestionsData = response.suggestions || [];
            window.correctionsData = response.grammar_corrections || [];
        }
    } catch (error) {
        messages.push({ text: 'Bot: Erro ao processar a mensagem. Tente novamente.', sender: 'bot' });
    }

    // Atualiza o chat e limpa o campo de entrada
    updateChatWindow();
    currentMessageInput.value = '';
}

// Função para atualizar a janela de chat
function updateChatWindow() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = ''; // Limpa o conteúdo

    // Adiciona mensagens ao chat
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add(msg.sender);
        messageElement.innerText = msg.text;
        chatWindow.appendChild(messageElement);
    });

    // Rola para o final do chat
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Exibe botões de sugestões/correções se houver dados
    if (window.suggestionsData.length || window.correctionsData.length) {
        displayButtons();
    }
}

// Função para mostrar botões de sugestões e correções
function displayButtons() {
    let buttonsDiv = document.querySelector('.buttons-container');
    if (!buttonsDiv) {
        buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('buttons-container');
        document.getElementById('chatWindow').appendChild(buttonsDiv);
    }
    buttonsDiv.innerHTML = ''; // Limpa os botões existentes

    // Botão de Sugestões
    if (window.suggestionsData.length) {
        const suggestionsButton = document.createElement('button');
        suggestionsButton.innerText = 'Mostrar Sugestões';
        suggestionsButton.onclick = toggleSuggestions;
        suggestionsButton.classList.add('styled-button'); // Adiciona a classe CSS
        buttonsDiv.appendChild(suggestionsButton);
    }

    // Botão de Correções Gramaticais
    if (window.correctionsData.length) {
        const correctionsButton = document.createElement('button');
        correctionsButton.innerText = 'Mostrar Correções Gramaticais';
        correctionsButton.onclick = toggleCorrections;
        correctionsButton.classList.add('styled-button'); // Adiciona a classe CSS
        buttonsDiv.appendChild(correctionsButton);
    }
}


// Função para alternar exibição das sugestões
function toggleSuggestions() {
    // Verifica se a caixa de correções está visível, se sim, a oculta
    const correctionsBox = document.getElementById('correctionsBox');
    if (correctionsBox && correctionsBox.style.display === 'block') {
        correctionsBox.style.display = 'none'; // Oculta a caixa de correções
    }

    const box = getOrCreateBox('suggestionsBox', 'Seggestions');
    toggleBoxVisibility(box, window.suggestionsData, '#d1e8f7');
}

// Função para alternar exibição das correções
function toggleCorrections() {
    // Verifica se a caixa de sugestões está visível, se sim, a oculta
    const suggestionsBox = document.getElementById('suggestionsBox');
    if (suggestionsBox && suggestionsBox.style.display === 'block') {
        suggestionsBox.style.display = 'none'; // Oculta a caixa de sugestões
    }

    const box = getOrCreateBox('correctionsBox', 'Corrections');
    toggleBoxVisibility(box, window.correctionsData, '#c8f1ff');
}

// Função utilitária para criar ou selecionar uma caixa
function getOrCreateBox(id, title) {
    let box = document.getElementById(id);
    if (!box) {
        box = document.createElement('div');
        box.id = id;
        box.style.display = 'none'; // Inicialmente oculto
        box.classList.add('info-box');
        document.getElementById('chatWindow').appendChild(box);
    }
    box.innerHTML = `<strong>${title}:</strong><ul></ul>`;
    return box;
}

// Função utilitária para alternar visibilidade da caixa
function toggleBoxVisibility(box, data, color) {
    if (box.style.display === 'none') {
        box.style.display = 'block';
        box.querySelector('ul').innerHTML = data.map(item => `<li>${item}</li>`).join('');
        box.style.backgroundColor = color; // Aplica a cor de fundo personalizada para cada caixa
    } else {
        box.style.display = 'none';
    }
}

// Função para alternar tema
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme', !isDark);
    const themeIcon = document.querySelector('.theme-toggle-btn i');
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Inicialização ao carregar a página
window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
    document.body.classList.add(savedTheme === 'light' ? 'light-theme' : 'dark-theme');
    const themeIcon = document.querySelector('.theme-toggle-btn i');
    themeIcon.classList.add(savedTheme === 'dark' ? 'fa-sun' : 'fa-moon');
    currentMessageInput = document.getElementById('currentMessage');
};

// Controle de gravação de voz
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        currentMessageInput.value = transcript;
    };

    recognition.onerror = (event) => console.error('Erro no reconhecimento de voz:', event.error);
}

function startRecording() {
    if (!recognition || isRecording) return;
    recognition.start();
    isRecording = true;
    document.getElementById('recordButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
}

function stopRecording() {
    if (!recognition || !isRecording) return;
    recognition.stop();
    isRecording = false;
    document.getElementById('recordButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}


// Inicialização do reconhecimento de voz
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        currentMessageInput.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz: ', event.error);
    };
} else {
    console.error('SpeechRecognition não é suportado neste navegador.');
}
