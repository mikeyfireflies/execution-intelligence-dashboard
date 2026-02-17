'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, History, HelpCircle, Plus } from 'lucide-react';

export default function FredChat({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'capabilities', 'history'
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm Fred. I've been upgraded with Direct Tool Access. I can now search live data in the dashboard. How can I help you?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Load threads on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedThreads = localStorage.getItem('fred_chat_threads');
            if (savedThreads) {
                try {
                    const parsed = JSON.parse(savedThreads);
                    setThreads(parsed);
                } catch (e) {
                    console.error("Failed to parse threads", e);
                }
            }
        }
    }, []);

    // Save threads when they change
    useEffect(() => {
        if (typeof window !== 'undefined' && threads.length > 0) {
            localStorage.setItem('fred_chat_threads', JSON.stringify(threads));
        }
    }, [threads]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom();
    }, [messages, activeTab]);

    const startNewChat = () => {
        const newThreadId = Date.now().toString();
        setCurrentThreadId(newThreadId);
        setMessages([
            { role: 'assistant', content: "New session started. How can I help you with dashboard data today?" }
        ]);
        setActiveTab('chat');
    };

    const loadThread = (thread) => {
        setCurrentThreadId(thread.id);
        setMessages(thread.messages);
        setActiveTab('chat');
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        // Ensure we have a thread ID
        let threadId = currentThreadId;
        if (!threadId) {
            threadId = Date.now().toString();
            setCurrentThreadId(threadId);
        }

        try {
            const response = await fetch('/api/fred/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const result = await response.json();
            const assistantMsg = { role: 'assistant', content: result.content };
            const finalMessages = [...newMessages, assistantMsg];

            setMessages(finalMessages);

            // Update threads list
            setThreads(prev => {
                const existingIndex = prev.findIndex(t => t.id === threadId);
                const updatedThread = {
                    id: threadId,
                    title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
                    timestamp: new Date().toISOString(),
                    messages: finalMessages
                };

                if (existingIndex >= 0) {
                    const newThreads = [...prev];
                    newThreads[existingIndex] = updatedThread;
                    return newThreads;
                } else {
                    return [updatedThread, ...prev];
                }
            });

        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please check your GOOGLE_API_KEY." }]);
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
                                <Sparkles size={10} /> Intelligence OS
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {activeTab === 'chat' && (
                            <button className="btn btn-icon btn-sm" title="New Chat" onClick={startNewChat} style={{ borderRadius: '8px' }}>
                                <Plus size={18} />
                            </button>
                        )}
                        <button className="btn btn-icon" onClick={onClose} style={{ borderRadius: '50%' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-secondary)',
                    background: 'var(--bg-secondary)',
                    padding: '0 12px'
                }}>
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            borderTop: '0', borderLeft: '0', borderRight: '0',
                            borderBottomWidth: '2px', borderBottomStyle: 'solid',
                            borderBottomColor: activeTab === 'chat' ? 'var(--brand-primary)' : 'transparent',
                            color: activeTab === 'chat' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <Bot size={16} /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('capabilities')}
                        style={{
                            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            borderTop: '0', borderLeft: '0', borderRight: '0',
                            borderBottomWidth: '2px', borderBottomStyle: 'solid',
                            borderBottomColor: activeTab === 'capabilities' ? 'var(--brand-primary)' : 'transparent',
                            color: activeTab === 'capabilities' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <HelpCircle size={16} /> Capabilities
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            borderTop: '0', borderLeft: '0', borderRight: '0',
                            borderBottomWidth: '2px', borderBottomStyle: 'solid',
                            borderBottomColor: activeTab === 'history' ? 'var(--brand-primary)' : 'transparent',
                            color: activeTab === 'history' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <History size={16} /> History
                    </button>
                </div>

                {activeTab === 'chat' && (
                    <>
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
                                    placeholder="Ask about live dashboard data..."
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
                        </div>
                    </>
                )}

                {activeTab === 'capabilities' && (
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Fred's Tools</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            I have direct integration with the Execution Dashboard. Here is what I can do:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '4px' }}>Health Score Monitoring</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>I can fetch the company's real-time health score and high-level execution metrics.</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>"What's our current health score?"</div>
                            </div>

                            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '4px' }}>Risk Analysis</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>I can analyze individual performance and identify who is currently at risk or has overdue tasks.</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>"Who is currently high risk?"</div>
                            </div>

                            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '4px' }}>Notion Goal Search</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>I can search the entire Notion Execution database for specific goals, owners, or statuses.</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>"Search for goals related to 'AI Integration'"</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Chat History</h3>
                            <button className="btn btn-primary btn-sm" onClick={startNewChat}>+ New Thread</button>
                        </div>

                        {threads.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                                <History size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p>No threads saved yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {threads.map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => loadThread(thread)}
                                        style={{
                                            padding: '12px 16px',
                                            background: currentThreadId === thread.id ? 'rgba(var(--brand-primary-rgb), 0.1)' : 'var(--bg-secondary)',
                                            borderRadius: '12px',
                                            border: currentThreadId === thread.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-primary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {thread.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {new Date(thread.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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
        </div>
    );
}
