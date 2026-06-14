(function() {
    const scriptTag = document.currentScript;
    const agentId = scriptTag.getAttribute('data-agent-id');
    const apiUrl = scriptTag.getAttribute('data-api-url') || 'http://localhost:8000';
    
    if (!agentId) {
        console.error('SalesGPT Widget: Missing data-agent-id attribute');
        return;
    }

    // Generate unique session ID for this user visitor
    let sessionId = localStorage.getItem('salesgpt_session_id');
    if (!sessionId) {
        sessionId = 'visitor_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('salesgpt_session_id', sessionId);
    }

    // Create Widget Container
    const container = document.createElement('div');
    container.id = 'salesgpt-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Chatbox
    const chatbox = document.createElement('div');
    chatbox.style.display = 'none';
    chatbox.style.flexDirection = 'column';
    chatbox.style.width = '350px';
    chatbox.style.height = '500px';
    chatbox.style.backgroundColor = '#ffffff';
    chatbox.style.borderRadius = '16px';
    chatbox.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.2)';
    chatbox.style.overflow = 'hidden';
    chatbox.style.marginBottom = '20px';
    chatbox.style.border = '1px solid #e2e8f0';
    
    // Header
    const header = document.createElement('div');
    header.style.backgroundColor = '#0f172a';
    header.style.color = '#ffffff';
    header.style.padding = '16px';
    header.style.fontWeight = 'bold';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></div>
            AI Sales Assistant
        </div>
        <button id="salesgpt-close-btn" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px;">×</button>
    `;
    chatbox.appendChild(header);

    // Message Area
    const messageArea = document.createElement('div');
    messageArea.style.flex = '1';
    messageArea.style.padding = '16px';
    messageArea.style.overflowY = 'auto';
    messageArea.style.display = 'flex';
    messageArea.style.flexDirection = 'column';
    messageArea.style.gap = '12px';
    messageArea.style.backgroundColor = '#f8fafc';
    chatbox.appendChild(messageArea);

    const addMessage = (text, isUser) => {
        const msg = document.createElement('div');
        msg.style.maxWidth = '80%';
        msg.style.padding = '10px 14px';
        msg.style.borderRadius = '12px';
        msg.style.fontSize = '14px';
        msg.style.lineHeight = '1.4';
        
        if (isUser) {
            msg.style.alignSelf = 'flex-end';
            msg.style.backgroundColor = '#2563eb';
            msg.style.color = '#ffffff';
            msg.style.borderBottomRightRadius = '4px';
        } else {
            msg.style.alignSelf = 'flex-start';
            msg.style.backgroundColor = '#ffffff';
            msg.style.color = '#1e293b';
            msg.style.border = '1px solid #e2e8f0';
            msg.style.borderBottomLeftRadius = '4px';
        }
        
        msg.textContent = text;
        messageArea.appendChild(msg);
        messageArea.scrollTop = messageArea.scrollHeight;
    };

    // Input Area
    const inputArea = document.createElement('form');
    inputArea.style.padding = '16px';
    inputArea.style.backgroundColor = '#ffffff';
    inputArea.style.borderTop = '1px solid #e2e8f0';
    inputArea.style.display = 'flex';
    inputArea.style.gap = '8px';
    
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Type your message...';
    inputField.style.flex = '1';
    inputField.style.padding = '10px 14px';
    inputField.style.border = '1px solid #e2e8f0';
    inputField.style.borderRadius = '8px';
    inputField.style.outline = 'none';
    inputField.style.fontSize = '14px';
    
    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.textContent = 'Send';
    sendButton.style.padding = '10px 16px';
    sendButton.style.backgroundColor = '#2563eb';
    sendButton.style.color = '#ffffff';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '8px';
    sendButton.style.cursor = 'pointer';
    sendButton.style.fontWeight = '500';
    
    inputArea.appendChild(inputField);
    inputArea.appendChild(sendButton);
    chatbox.appendChild(inputArea);

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.style.width = '60px';
    toggleBtn.style.height = '60px';
    toggleBtn.style.borderRadius = '30px';
    toggleBtn.style.backgroundColor = '#2563eb';
    toggleBtn.style.color = '#ffffff';
    toggleBtn.style.border = 'none';
    toggleBtn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.bottom = '0';
    toggleBtn.style.right = '0';
    toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    // Logic
    let isOpen = false;
    let initialized = false;

    const toggleChat = () => {
        isOpen = !isOpen;
        chatbox.style.display = isOpen ? 'flex' : 'none';
        toggleBtn.style.display = isOpen ? 'none' : 'flex';
        
        if (isOpen && !initialized) {
            addMessage("Hi! I'm here to help answer your questions.", false);
            initialized = true;
        }
    };

    toggleBtn.addEventListener('click', toggleChat);
    
    header.querySelector('#salesgpt-close-btn').addEventListener('click', toggleChat);

    inputArea.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = inputField.value.trim();
        if (!text) return;
        
        inputField.value = '';
        addMessage(text, true);
        
        // Disable input while loading
        inputField.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';
        
        try {
            const res = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: text,
                    agent_id: agentId
                })
            });
            
            const data = await res.json();
            addMessage(data.response, false);
            
        } catch(err) {
            console.error('SalesGPT Widget Error:', err);
            addMessage('Sorry, I am having trouble connecting right now.', false);
        } finally {
            inputField.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            inputField.focus();
        }
    });

    container.appendChild(chatbox);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);
})();
