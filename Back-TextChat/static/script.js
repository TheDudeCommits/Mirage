document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const streamingMode = document.getElementById('streamingMode');
    const responseSection = document.getElementById('responseSection');
    const responseContent = document.getElementById('responseContent');
    const errorSection = document.getElementById('errorSection');
    const errorContent = document.getElementById('errorContent');
    const statusSection = document.getElementById('statusSection');
    const statusMessage = document.getElementById('statusMessage');

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) {
            showError('Please enter a message');
            return;
        }

        // Check if streaming mode is enabled
        const isStreamingMode = streamingMode.checked;
        
        if (isStreamingMode) {
            handleStreamingRequest(message);
        } else {
            handleRegularRequest(message);
        }
    });

    async function handleRegularRequest(message) {
        setLoadingState(true);
        hideAllSections();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000);
            
            const response = await fetch('/api/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive'
                },
                body: JSON.stringify({ message: message }),
                signal: controller.signal,
                keepalive: true
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (data.reply) {
                showResponse(data.reply);
            } else {
                throw new Error('No reply received from server');
            }

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    async function handleStreamingRequest(message) {
        setLoadingState(true);
        hideAllSections();
        showStatus('Connecting to server...');

        try {
            const response = await fetch('/api/text/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.error) {
                                throw new Error(data.error);
                            } else if (data.status === 'complete' && data.reply) {
                                hideStatus();
                                showResponse(data.reply);
                            } else if (data.status && data.message) {
                                updateStatus(data.message);
                            }
                        } catch (parseError) {
                            console.error('Parse error:', parseError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            hideStatus();
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        sendButton.disabled = isLoading;
        messageInput.disabled = isLoading;
        
        if (isLoading) {
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
        } else {
            sendButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send Message';
        }
    }

    function showStatus(message) {
        statusMessage.textContent = message;
        statusSection.style.display = 'block';
    }

    function updateStatus(message) {
        statusMessage.textContent = message;
    }

    function hideStatus() {
        statusSection.style.display = 'none';
    }

    function showResponse(reply) {
        responseContent.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Success!</strong> Received response from OpenAI Assistant.
            </div>
            <div class="bg-dark p-3 rounded">
                <pre class="mb-0 text-light">${escapeHtml(reply)}</pre>
            </div>
        `;
        responseSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        // Scroll to response
        responseSection.scrollIntoView({ behavior: 'smooth' });
    }

    function showError(error) {
        errorContent.textContent = error;
        errorSection.style.display = 'block';
        responseSection.style.display = 'none';
        
        // Scroll to error
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    function hideAllSections() {
        responseSection.style.display = 'none';
        errorSection.style.display = 'none';
        statusSection.style.display = 'none';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Focus on message input when page loads
    messageInput.focus();
});
