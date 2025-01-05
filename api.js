// Função para enviar a mensagem para a API e receber a resposta
async function sendToBackend(userInput) {
    try {
        const response = await fetch('http://127.0.0.1:5000/process', {  // URL da API
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: userInput }),
        });

        const data = await response.json();

        if (response.ok) {
            return data;  // Retorna a resposta da IA
        } else {
            throw new Error(data.error || 'Erro ao processar a solicitação');
        }
    } catch (error) {
        console.error('Erro ao enviar a requisição:', error);
        return { error: 'Erro ao comunicar com o backend' };
    }
}
