// Função para alternar entre tema claro e escuro
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
    const themeToggleButton = document.querySelector('.theme-toggle-btn i');

    if (currentTheme === 'light') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggleButton.classList.remove('fa-moon');
        themeToggleButton.classList.add('fa-sun'); // Altera para ícone de sol
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleButton.classList.remove('fa-sun');
        themeToggleButton.classList.add('fa-moon'); // Altera para ícone de lua
    }

    // Salva o tema selecionado no Local Storage
    localStorage.setItem('theme', currentTheme === 'light' ? 'dark' : 'light');
}

// Ao carregar a página, verifica se o tema foi previamente salvo
window.onload = () => {
    const savedTheme = localStorage.getItem('theme');
    const themeToggleButton = document.querySelector('.theme-toggle-btn i');
    if (savedTheme) {
        document.body.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
        if (savedTheme === 'dark') {
            themeToggleButton.classList.remove('fa-moon');
            themeToggleButton.classList.add('fa-sun'); // Altera para ícone de sol
        } else {
            themeToggleButton.classList.remove('fa-sun');
            themeToggleButton.classList.add('fa-moon'); // Altera para ícone de lua
        }
    } else {
        document.body.classList.add('light-theme');
        themeToggleButton.classList.remove('fa-sun');
        themeToggleButton.classList.add('fa-moon'); // Inicializa com ícone de lua
    }

    // Inicializa a variável currentMessageInput
    currentMessageInput = document.getElementById('currentMessage');  // Defina corretamente o input de mensagem
};

// Variáveis de reconhecimento de voz
let recognition;
let isRecording = false;
let messages = [];  // Inicializa a variável 'messages' para armazenar as mensagens

// Função para enviar a mensagem ao backend e processar a resposta
async function sendMessage() {
    const message = currentMessageInput.value.trim();
    if (message) {
        // Adiciona a mensagem do usuário ao chat imediatamente
        messages.push({ text: message, sender: 'user' });
        updateChatWindow();

        // Adiciona uma mensagem temporária de "aguarde" enquanto processa
        messages.push({ text: 'Bot: Aguardando resposta...', sender: 'bot', temporary: true });
        updateChatWindow();

        // Envia a mensagem para o backend e recebe a resposta da IA
        const response = await sendToBackend(message);

        // Remove a mensagem temporária de "aguarde"
        messages = messages.filter(msg => !msg.temporary);

        if (response.error) {
            messages.push({ text: response.error, sender: 'bot' });
        } else {
            // Exibe a resposta do bot
            const botResponse = `Bot: ${response.response}`;
            messages.push({ text: botResponse, sender: 'bot' });

            // Exibe as sugestões, correções de gramática e sentimento
            if (response.suggestions) {
                const suggestions = `Sugestões: ${response.suggestions}`;
                messages.push({ text: suggestions, sender: 'bot' });
            }

            if (response.grammar_corrections) {
                const corrections = `Correções gramaticais: ${response.grammar_corrections}`;
                messages.push({ text: corrections, sender: 'bot' });
            }

            if (response.sentiment) {
                const sentiment = `Sentimento: ${response.sentiment}`;
                messages.push({ text: sentiment, sender: 'bot' });
            }
        }

        // Atualiza a janela de chat com a resposta da IA
        updateChatWindow();
    }
    currentMessageInput.value = '';  // Limpa o campo de entrada
}

// Função para atualizar a janela de chat
function updateChatWindow() {
    const chatWindow = document.getElementById('chatWindow');  // Certifique-se de que o elemento existe no HTML
    chatWindow.innerHTML = '';  // Limpa a janela de chat

    // Itera sobre as mensagens e as exibe no chat
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add(msg.sender);  // Adiciona uma classe para estilizar as mensagens
        messageElement.innerText = msg.text;
        chatWindow.appendChild(messageElement);
    });

    // Rola a janela para baixo, para mostrar a mensagem mais recente
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Funções de controle de gravação de voz
function startRecording() {
    if (recognition) {
        recognition.start();
        isRecording = true;
        document.getElementById('recordButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
    }
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        document.getElementById('recordButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
    }
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

} else {
    console.error('SpeechRecognition não é suportado neste navegador.');
}
