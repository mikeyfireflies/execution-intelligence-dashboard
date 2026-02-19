'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, History, HelpCircle, Plus, Settings, Key, Check, Eye, EyeOff, Zap, Brain, Cpu } from 'lucide-react';

// Lightweight markdown renderer for Fred's chat messages
function renderMarkdown(text) {
    if (!text) return '';
    // Split into lines for block-level processing
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Headings
        if (line.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<div style="font-weight:700;font-size:0.95rem;margin:12px 0 6px;color:var(--text-primary)">${inlineFormat(line.slice(4))}</div>`;
            continue;
        }
        if (line.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<div style="font-weight:700;font-size:1rem;margin:14px 0 6px;color:var(--text-primary)">${inlineFormat(line.slice(3))}</div>`;
            continue;
        }

        // Unordered list items (- or *)
        const ulMatch = line.match(/^[\s]*[-*]\s+(.*)/);
        if (ulMatch) {
            if (!inList) { html += '<ul style="margin:4px 0;padding-left:18px">'; inList = true; }
            html += `<li style="margin:3px 0;line-height:1.5">${inlineFormat(ulMatch[1])}</li>`;
            continue;
        }

        // Ordered list items (1. 2. etc)
        const olMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
        if (olMatch) {
            if (!inList) { html += '<ul style="margin:4px 0;padding-left:18px;list-style:decimal">'; inList = true; }
            html += `<li style="margin:3px 0;line-height:1.5">${inlineFormat(olMatch[1])}</li>`;
            continue;
        }

        // Close list if we were in one
        if (inList) { html += '</ul>'; inList = false; }

        // Empty line = paragraph break
        if (line.trim() === '') {
            html += '<div style="height:8px"></div>';
            continue;
        }

        // Regular paragraph
        html += `<div style="line-height:1.5;margin:2px 0">${inlineFormat(line)}</div>`;
    }

    if (inList) html += '</ul>';
    return html;
}

// Inline formatting: bold, italic, code, links
function inlineFormat(text) {
    return text
        // Code blocks (backticks)
        .replace(/`([^`]+)`/g, '<code style="background:rgba(var(--brand-primary-rgb),0.1);padding:1px 5px;border-radius:4px;font-size:0.85em;color:var(--brand-primary)">$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--brand-primary);text-decoration:none;font-weight:500" target="_blank" rel="noopener">$1</a>');
}

export default function FredChat({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'skills', 'history', 'config'
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm Fred. I've been upgraded with Direct Tool Access. I can now search live data in the dashboard. How can I help you?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Config state — dual key support
    const [apiKeys, setApiKeys] = useState({ 1: '', 2: '' });
    const [activeKey, setActiveKey] = useState(1); // 1 or 2
    const [showKey, setShowKey] = useState({ 1: false, 2: false });
    const [apiKeySaved, setApiKeySaved] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
    const [intelligenceMode, setIntelligenceMode] = useState('balanced');

    const models = [
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', note: 'Latest · Fast · 1M context' },
        { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google', note: 'Advanced reasoning · 2M context' },
        { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp', provider: 'Google', note: 'Experimental · Cutting-edge' },
    ];

    // Load config on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedThreads = localStorage.getItem('fred_chat_threads');
            if (savedThreads) {
                try { setThreads(JSON.parse(savedThreads)); } catch (e) { }
            }
            const k1 = localStorage.getItem('fred_api_key_1') || '';
            const k2 = localStorage.getItem('fred_api_key_2') || '';
            const active = parseInt(localStorage.getItem('fred_active_key') || '1', 10);
            setApiKeys({ 1: k1, 2: k2 });
            setActiveKey(active);
            const model = localStorage.getItem('fred_model');
            if (model) setSelectedModel(model);
            const mode = localStorage.getItem('fred_intelligence_mode');
            if (mode) setIntelligenceMode(mode);
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

    const handleSaveConfig = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('fred_api_key_1', apiKeys[1]);
            localStorage.setItem('fred_api_key_2', apiKeys[2]);
            localStorage.setItem('fred_active_key', String(activeKey));
            localStorage.setItem('fred_model', selectedModel);
            localStorage.setItem('fred_intelligence_mode', intelligenceMode);
        }
        setApiKeySaved(true);
        setTimeout(() => setApiKeySaved(false), 2500);
    };

    const setActiveAndSave = (num) => {
        setActiveKey(num);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fred_active_key', String(num));
        }
    };

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
                    messages: newMessages,
                    apiKey: apiKeys[activeKey] || undefined,
                    model: selectedModel,
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const result = await response.json();
            const assistantMsg = { role: 'assistant', content: result.content };
            const finalMessages = [...newMessages, assistantMsg];

            setMessages(finalMessages);

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
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please check your API key in the Configuration tab." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabStyle = (tab) => ({
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '6px',
        background: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
        borderTop: '0', borderLeft: '0', borderRight: '0',
        borderBottomWidth: '2px', borderBottomStyle: 'solid',
        borderBottomColor: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
        color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
    });

    const intelligenceModes = [
        { id: 'fast', icon: <Zap size={18} />, label: 'Fast', desc: 'Quick responses with basic analysis. Best for simple questions and quick lookups.' },
        { id: 'balanced', icon: <Brain size={18} />, label: 'Balanced', desc: 'Good quality with moderate speed. Recommended for most use cases.' },
        { id: 'ultrathink', icon: <Cpu size={18} />, label: 'Ultrathink', desc: 'Deep analysis with comprehensive reasoning. For complex questions requiring thorough research.' },
    ];

    return (
        <div className="fred-chat-overlay" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 3000, display: 'flex', justifyContent: 'flex-end'
        }} onClick={onClose}>
            <div className="fred-chat-drawer" style={{
                width: '100%', maxWidth: '480px',
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
                    padding: '0 8px',
                    overflowX: 'auto',
                }}>
                    <button onClick={() => setActiveTab('chat')} style={tabStyle('chat')}>
                        <Bot size={14} /> Chat
                    </button>
                    <button onClick={() => setActiveTab('skills')} style={tabStyle('skills')}>
                        <HelpCircle size={14} /> Skills
                    </button>
                    <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>
                        <History size={14} /> History
                    </button>
                    <button onClick={() => setActiveTab('config')} style={tabStyle('config')}>
                        <Settings size={14} /> Configuration
                    </button>
                </div>

                {/* ── CHAT TAB ── */}
                {activeTab === 'chat' && (
                    <>
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
                                    }}>
                                        {msg.role === 'user' ? (
                                            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: 'var(--brand-primary)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Bot size={16} color="white" />
                                    </div>
                                    <div style={{
                                        padding: '12px 18px', background: 'var(--bg-secondary)',
                                        borderRadius: '18px', borderBottomLeftRadius: '2px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <svg className="fred-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            Fred is thinking...
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

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

                {/* ── CAPABILITIES TAB ── */}
                {activeTab === 'skills' && (
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Fred's Skills</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            I have direct integration with the Execution Dashboard. Here is what I can do:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { title: '📊 Health Score Monitoring', desc: "Fetch the company's real-time health score with a weighted breakdown (Completion 30%, Overdue 25%, Recency 20%, Blocked 15%, Priority Lag 10%).", example: '"What\'s our current health score?"' },
                                { title: '👥 Team Member Directory', desc: 'List all team members with their roles, departments, bios, and direct profile links from the Team Directory.', example: '"List all the team members"' },
                                { title: '🚨 Risk Analysis', desc: 'Identify who is at risk (Red/Amber/Green) based on overdue items, blocked tasks, and update freshness.', example: '"Who is currently at risk?"' },
                                { title: '🏢 Squad Health', desc: 'Analyze squad-level health: blockers, ownership clarity, stuck goals, and effort concentration.', example: '"How is the Mobile Squad doing?"' },
                                { title: '🔍 Goal Search', desc: 'Search the Notion Execution Database for specific goals by title or owner name. Returns source URLs.', example: '"Find goals related to AI Integration"' },
                                { title: '🚦 Status Filter', desc: 'Filter all goals by status: In Progress, Blocked, Done, Not Started, Overdue, or At Risk. Optionally filter by owner.', example: '"Show me all blocked tasks" or "What is overdue for Greg?"' },
                                { title: '📈 Trend Comparison', desc: 'Analyzes week-over-week performance. Tells you if metrics like Health Score and Overdue rates are improving or slipping.', example: '"Are we getting better or worse than last week?"' },
                                { title: '🏆 Performance Leaderboard', desc: 'Rank team members by tasks completed and total effort points delivered in the last 30 days.', example: '"Who is the top performer this month?"' },
                                { title: '⚠️ Stale Goal Detector', desc: 'Identify "zombie" goals that haven\'t been updated in over 7 days, ensuring nothing falls through the cracks.', example: '"What goals have been forgotten?"' },
                                { title: '🧠 Calculation Explainer', desc: 'Explain exactly how any dashboard metric is calculated — Health Score formula, Risk triggers, Velocity logic.', example: '"How is the health score calculated?"' },
                            ].map((item) => (
                                <div key={item.title} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '4px' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.desc}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>{item.example}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── HISTORY TAB ── */}
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
                                            cursor: 'pointer', transition: 'all 0.2s'
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

                {/* ── CONFIGURATION TAB ── */}
                {activeTab === 'config' && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>

                        {/* Intelligence Section */}
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-secondary)' }}>
                            <div style={{ marginBottom: '4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Intelligence</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Configure how Fred responds to your queries</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                {intelligenceModes.map(mode => (
                                    <div
                                        key={mode.id}
                                        onClick={() => setIntelligenceMode(mode.id)}
                                        style={{
                                            padding: '14px 12px',
                                            borderRadius: '12px',
                                            border: `2px solid ${intelligenceMode === mode.id ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                            background: intelligenceMode === mode.id ? 'rgba(var(--brand-primary-rgb), 0.07)' : 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                        }}
                                    >
                                        {intelligenceMode === mode.id && (
                                            <div style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                width: '18px', height: '18px', borderRadius: '50%',
                                                background: 'var(--brand-primary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Check size={10} color="white" />
                                            </div>
                                        )}
                                        <div style={{ color: 'var(--brand-primary)', marginBottom: '6px' }}>{mode.icon}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{mode.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{mode.desc}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Model selector */}
                            <div style={{ marginTop: '4px' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Model</div>
                                <select
                                    value={selectedModel}
                                    onChange={e => setSelectedModel(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
                                        outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                                <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', marginTop: '6px' }}>
                                    {models.find(m => m.id === selectedModel)?.note}
                                </div>
                            </div>
                        </div>

                        {/* API Keys Section */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>API Keys</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                Store up to two Google Gemini keys and switch between them instantly.
                            </div>

                            {[1, 2].map(num => {
                                const isActive = activeKey === num;
                                const hasKey = !!apiKeys[num];
                                return (
                                    <div key={num} style={{
                                        padding: '16px', marginBottom: '12px',
                                        borderRadius: '12px',
                                        border: `2px solid ${isActive ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                        background: isActive ? 'rgba(var(--brand-primary-rgb), 0.05)' : 'var(--bg-secondary)',
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                                background: isActive ? 'var(--brand-primary)' : 'linear-gradient(135deg, #4285F4, #34A853)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Key size={14} color="white" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    Key {num}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Google Gemini</div>
                                            </div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {hasKey && isActive && (
                                                    <div style={{
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        color: 'var(--brand-primary)', background: 'rgba(var(--brand-primary-rgb), 0.12)',
                                                        padding: '2px 10px', borderRadius: '20px',
                                                        border: '1px solid rgba(var(--brand-primary-rgb), 0.3)',
                                                    }}>
                                                        ● Active
                                                    </div>
                                                )}
                                                {hasKey && !isActive && (
                                                    <button
                                                        onClick={() => setActiveAndSave(num)}
                                                        style={{
                                                            fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px',
                                                            borderRadius: '20px', cursor: 'pointer',
                                                            border: '1px solid var(--border-primary)',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        Set Active
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showKey[num] ? 'text' : 'password'}
                                                placeholder="AIza..."
                                                value={apiKeys[num]}
                                                onChange={e => setApiKeys(prev => ({ ...prev, [num]: e.target.value }))}
                                                style={{
                                                    width: '100%', padding: '10px 40px 10px 14px',
                                                    background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                                                    borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem',
                                                    outline: 'none', boxSizing: 'border-box',
                                                    fontFamily: apiKeys[num] && !showKey[num] ? 'monospace' : 'inherit',
                                                }}
                                            />
                                            <button
                                                onClick={() => setShowKey(prev => ({ ...prev, [num]: !prev[num] }))}
                                                style={{
                                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
                                                }}
                                            >
                                                {showKey[num] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                                Get your API keys at{' '}
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                                    style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>
                                    aistudio.google.com
                                </a>
                            </div>

                            {/* Save button */}
                            <button
                                onClick={handleSaveConfig}
                                className="btn btn-primary"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '0.9rem', fontWeight: 600,
                                    background: apiKeySaved ? '#22c55e' : undefined,
                                    transition: 'background 0.3s',
                                }}
                            >
                                {apiKeySaved ? <><Check size={16} /> Saved!</> : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                )}


                <style jsx>{`
                    @keyframes slideIn {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    @keyframes fredSpin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .fred-spin {
                        animation: fredSpin 0.9s linear infinite;
                        flex-shrink: 0;
                    }
                `}</style>
            </div>
        </div>
    );
}
