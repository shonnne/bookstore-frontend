import { useState } from "react";

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMessage = { sender: "user", text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const username = localStorage.getItem("username") || sessionStorage.getItem("username");
        try {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input, token, username }),
            });
            const data = await response.json();
            setMessages(prev => [...prev, { sender: "bot", text: data.reply }]);
        } catch {
            setMessages(prev => [...prev, { sender: "bot", text: "Sorry, I couldn't connect to the chatbot." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
            {isOpen && (
                <div style={{ width: "320px", height: "420px", background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", marginBottom: "12px" }}>
                    <div style={{ background: "#4f46e5", color: "white", padding: "12px 16px", borderRadius: "12px 12px 0 0", fontWeight: "bold" }}>
                        📚 Bookstore Assistant
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "#4f46e5" : "#f3f4f6", color: msg.sender === "user" ? "white" : "black", padding: "8px 12px", borderRadius: "12px", maxWidth: "80%", fontSize: "14px" }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && <div style={{ alignSelf: "flex-start", color: "#9ca3af", fontSize: "13px" }}>Typing...</div>}
                    </div>
                    <div style={{ display: "flex", padding: "8px", borderTop: "1px solid #e5e7eb" }}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask me anything..." style={{ flex: 1, padding: "8px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                        <button onClick={sendMessage} style={{ marginLeft: "8px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}>Send</button>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#4f46e5", color: "white", border: "none", fontSize: "24px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", display: "block", marginLeft: "auto" }}>
                {isOpen ? "✕" : "💬"}
            </button>
        </div>
    );
};

export default ChatBot;