// ===============================
// AI CHAT ELEMENTS
// ===============================

const aiToggleBtn = document.getElementById("aiToggleBtn");
const aiChatWindow = document.getElementById("aiChatWindow");
const closeAiChat = document.getElementById("closeAiChat");
const aiMessages = document.getElementById("aiMessages");
const aiInput = document.getElementById("aiInput");
const sendAiMessage = document.getElementById("sendAiMessage");
const aiChips = document.querySelectorAll(".ai-chip");


// ===============================
// OPEN / CLOSE CHAT
// ===============================

aiToggleBtn?.addEventListener("click", () => {

    aiChatWindow.style.display = "flex";

    aiInput.focus();

});

closeAiChat?.addEventListener("click", () => {

    aiChatWindow.style.display = "none";

});


// ===============================
// ADD MESSAGE
// ===============================

function addMessage(message, sender = "ai") {

    const div = document.createElement("div");

    div.className =
        sender === "user"
            ? "ai-message user-message"
            : "ai-message";

        if (sender === "user") {

            div.innerHTML = message;
            
        }
        else {        
            div.innerHTML = `
                <div>${message}</div>

                <div class="copy-container">
                    <button class="copy-btn">
                        📋 Copy
                    </button>
                </div>
            `;
        
        }

    aiMessages.appendChild(div);

        const copyBtn =
        div.querySelector(".copy-btn");

    if (copyBtn) {

        copyBtn.addEventListener("click", () => {

            navigator.clipboard.writeText(message);

            copyBtn.innerHTML = "✅ Copied";

            setTimeout(() => {

                copyBtn.innerHTML = "📋 Copy";

            }, 1500);

        });

    }

    aiMessages.scrollTop = aiMessages.scrollHeight;

    saveChat();

}


function showTyping() {

    const div = document.createElement("div");

    div.className = "ai-message";

    div.id = "typingIndicator";

    div.innerHTML = `
        🤖 <span class="typing-dots">
            Thinking...
        </span>
        `;

    aiMessages.appendChild(div);

    aiMessages.scrollTop = aiMessages.scrollHeight;

}

function hideTyping() {

    document
        .getElementById("typingIndicator")
        ?.remove();

    saveChat();

}

// ===============================
// CHAT HISTORY
// ===============================

function saveChat() {

    localStorage.setItem(
        "aiChatHistory",
        aiMessages.innerHTML
    );

}

function loadChat() {

    const history = localStorage.getItem(
        "aiChatHistory"
    );

    if (history) {

        aiMessages.innerHTML = history;


        aiMessages.querySelectorAll(".copy-btn").forEach(button => {

            button.addEventListener("click", () => {
        
                const text =
                    button.previousElementSibling.innerText;
        
                navigator.clipboard.writeText(text);
        
                button.innerHTML = "✅ Copied";
        
                setTimeout(() => {
        
                    button.innerHTML = "📋 Copy";
        
                },1500);
        
            });
        
        });

    }

}


// ===============================
// SEND MESSAGE (UI ONLY)
// ===============================
async function sendMessage() {

    if (sendAiMessage.disabled) return;

    const question = aiInput.value.trim();

    if (!question) return;

    addMessage(question, "user");

    aiInput.value = "";

    sendAiMessage.disabled = true;

    aiInput.disabled = true;

    showTyping();

    try {

        const response = await fetch(`${API_BASE_URL}/api/ai/query`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question
            })

        });

        const data = await response.json();

        hideTyping();

        sendAiMessage.disabled = false;

        aiInput.disabled = false;

        aiInput.focus();

        if (data.success) {

            addMessage(data.answer);

        } else {

            addMessage("❌ " + data.message);

        }

    }
    catch (error) {

        console.error(error);

        hideTyping();

        sendAiMessage.disabled = false;

        aiInput.disabled = false;

        aiInput.focus();

        addMessage("⚠ Unable to connect to AI server.");

    }

}


// ===============================
// SUGGESTION CHIPS
// ===============================

aiChips.forEach(chip => {

    chip.addEventListener("click", () => {

        aiInput.value = chip.textContent.trim();

        sendMessage();

    });

});



// ===============================
// EVENTS
// ===============================

sendAiMessage?.addEventListener("click", sendMessage);

aiInput?.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();

    }

});


loadChat();


// ===============================
// AUTO RESIZE
// ===============================

aiInput?.addEventListener("input", () => {

    aiInput.style.height = "55px";

    aiInput.style.height =
        aiInput.scrollHeight + "px";

});