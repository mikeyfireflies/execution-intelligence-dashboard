'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';

export default function FredChat({ isOpen, onClose, data }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm Fred. I have full context of this dashboard. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/fred/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    dashboardData: data
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const result = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please make sure the AI API key is configured." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fred-chat-overlay" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 3000, display: 'flex', justifyContent: 'flex-end'
        }} onClick={onClose}>
            <div className="fred-chat-drawer" style={{
                width: '100%', maxWidth: '450px',
                background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-primary)',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-xl)',
                animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="fred-chat-header" style={{
                    padding: '20px', borderBottom: '1px solid var(--border-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(var(--brand-primary-rgb), 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--brand-primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(var(--brand-primary-rgb), 0.3)'
                        }}>
                            <img src="/fred-icon.svg" alt="Fred" style={{ width: '28px', height: '28px' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Fred</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={10} /> Dashboard Agent Active
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-icon" onClick={onClose} style={{ borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="fred-chat-messages" style={{
                    flex: 1, overflowY: 'auto', padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '20px'
                }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '12px',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--brand-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="white" />}
                            </div>
                            <div style={{
                                maxWidth: '80%', padding: '14px 18px', borderRadius: '18px',
                                borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '18px',
                                borderBottomRightRadius: msg.role === 'user' ? '2px' : '18px',
                                background: msg.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                fontSize: '0.9375rem', lineHeight: '1.5',
                                boxShadow: msg.role === 'assistant' ? 'var(--shadow-sm)' : 'none',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--brand-primary)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Bot size={16} color="white" />
                            </div>
                            <div style={{ padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: '18px', display: 'flex', gap: '4px' }}>
                                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="fred-chat-input-container" style={{
                    padding: '24px', borderTop: '1px solid var(--border-secondary)',
                    background: 'var(--bg-primary)'
                }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="Ask Fred about dashboard performance..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            style={{
                                flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                borderRadius: '12px', padding: '12px 16px', color: 'var(--text-primary)',
                                outline: 'none', fontSize: '0.9375rem'
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            style={{ width: '44px', height: '44px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setInput("Who is at high risk?")}>Risks?</button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setInput("Summarize team velocity")}>Velocity?</button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setInput("What's the overall health?")}>Health?</button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .typing-dot {
                    width: 6px; height: 6px; background: var(--text-tertiary);
                    border-radius: 50%; animation: typing 1.4s infinite ease-in-out;
                }
                @keyframes typing {
                    0%, 80%, 100% { opacity: 0; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
}
