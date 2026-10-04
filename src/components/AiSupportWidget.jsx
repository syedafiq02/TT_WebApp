/*
 * Terpaling AI Support widget (components/ai-support/widget.blade.php +
 * resources/js/ai-support.js). Same markup and CSS; replies come from the
 * offline knowledge base and conversations are kept in localStorage.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { answer, SUGGESTIONS } from '../data/aiKnowledge';
import { useStore } from '../data/store';

const MAX_LENGTH = 2000;
const RECENT_MS = 24 * 60 * 60 * 1000;

const PATHS = {
    chat: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
    sparkles: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z',
    close: 'M6 18 18 6M6 6l12 12',
    minimise: 'm19.5 8.25-7.5 7.5-7.5-7.5',
    send: 'M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5',
    new: 'M12 4.5v15m7.5-7.5h-15',
    history: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    back: 'M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18',
};

function Svg({ name }) {
    return (
        <svg className="tt-ai-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" aria-hidden="true" focusable="false">
            <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[name]} />
        </svg>
    );
}

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (iso) => {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString() ? `Today, ${formatTime(iso)}` : date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Inline Markdown subset: **bold**, `code`, [label](/path). */
function Inline({ text }) {
    const out = [];
    const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index));
        if (m[1] !== undefined) out.push(<strong key={m.index}>{m[1]}</strong>);
        else if (m[2] !== undefined) out.push(<code key={m.index}>{m[2]}</code>);
        else if (m[4].startsWith('/')) out.push(<Link key={m.index} to={m[4]}>{m[3]}</Link>);
        else out.push(m[3]);
        last = pattern.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

function Markdown({ text }) {
    const blocks = [];
    for (const raw of text.split('\n')) {
        const line = raw.trimEnd();
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
        const last = blocks[blocks.length - 1];
        if (!line.trim()) blocks.push({ type: 'gap' });
        else if (bullet || numbered) {
            const type = bullet ? 'ul' : 'ol';
            if (last?.type === type) last.items.push((bullet || numbered)[1]);
            else blocks.push({ type, items: [(bullet || numbered)[1]] });
        } else if (last?.type === 'p') last.lines.push(line);
        else blocks.push({ type: 'p', lines: [line] });
    }
    return blocks.map((b, i) => {
        if (b.type === 'p')
            return (
                <p key={i}>
                    {b.lines.map((l, j) => (
                        <Fragment key={j}>
                            {j > 0 && <br />}
                            <Inline text={l} />
                        </Fragment>
                    ))}
                </p>
            );
        if (b.type === 'ul' || b.type === 'ol') {
            const Tag = b.type;
            return (
                <Tag key={i}>
                    {b.items.map((item, j) => (
                        <li key={j}>
                            <Inline text={item} />
                        </li>
                    ))}
                </Tag>
            );
        }
        return null;
    });
}

function loadConversations(userId) {
    try {
        return JSON.parse(localStorage.getItem(`tt-ai-${userId}`) ?? '[]');
    } catch {
        return [];
    }
}

export function AiSupportWidget() {
    const { db, user } = useStore();
    const ready = !!user;
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(false);
    const [conversations, setConversations] = useState(() => (user ? loadConversations(user.id) : []));
    const [activeId, setActiveId] = useState(null);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [restored, setRestored] = useState(false);
    const log = useRef(null);
    const inputRef = useRef(null);
    const launcher = useRef(null);

    useEffect(() => {
        setConversations(user ? loadConversations(user.id) : []);
        setActiveId(null);
        setRestored(false);
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!user) return;
        try {
            localStorage.setItem(`tt-ai-${user.id}`, JSON.stringify(conversations.slice(0, 20)));
        } catch {
            /* storage unavailable */
        }
    }, [conversations, user]);

    const active = conversations.find((c) => c.id === activeId);
    const messages = active?.messages ?? [];

    useEffect(() => {
        requestAnimationFrame(() => log.current && (log.current.scrollTop = log.current.scrollHeight));
    }, [messages.length, sending, open]);

    useEffect(() => {
        if (!inputRef.current) return;
        const el = inputRef.current;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
        el.style.overflowY = el.scrollHeight > 144 ? 'auto' : 'hidden';
    }, [input]);

    const openPanel = () => {
        setOpen(true);
        setUnread(false);
        if (ready && !restored) {
            setRestored(true);
            const latest = conversations[0];
            if (latest && Date.now() - new Date(latest.updated_at).getTime() < RECENT_MS) setActiveId(latest.id);
        }
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const closePanel = () => {
        setOpen(false);
        launcher.current?.focus();
    };

    const send = (raw) => {
        const text = String(raw ?? '').trim();
        if (sending || !text || text.length > MAX_LENGTH) return;
        const at = new Date().toISOString();
        let id = activeId;
        setShowHistory(false);
        setInput('');
        setConversations((all) => {
            if (id && all.some((c) => c.id === id)) {
                return all.map((c) => (c.id === id ? { ...c, updated_at: at, messages: [...c.messages, { role: 'user', content: text, created_at: at }] } : c));
            }
            id = Date.now();
            return [{ id, title: text.slice(0, 60), updated_at: at, messages: [{ role: 'user', content: text, created_at: at }] }, ...all];
        });
        setActiveId(id);
        setSending(true);
        setTimeout(() => {
            const reply = { role: 'assistant', content: answer(text, db, user), created_at: new Date().toISOString() };
            setConversations((all) => all.map((c) => (c.id === id ? { ...c, updated_at: reply.created_at, messages: [...c.messages, reply] } : c)));
            setSending(false);
            setOpen((isOpen) => {
                if (!isOpen) setUnread(true);
                return isOpen;
            });
        }, 900 + Math.random() * 700);
    };

    const nearLimit = input.length > MAX_LENGTH * 0.8;

    return (
        <div className={`tt-ai${open ? ' is-open' : ''}`} data-state={ready ? 'ready' : 'guest'} onKeyDown={(e) => e.key === 'Escape' && open && (e.stopPropagation(), closePanel())}>
            <button
                ref={launcher}
                type="button"
                className="tt-ai-launcher"
                aria-expanded={open}
                aria-controls="tt-ai-panel"
                aria-label={open ? 'Close Terpaling AI Support chat' : 'Open Terpaling AI Support chat'}
                onClick={() => (open ? closePanel() : openPanel())}
            >
                <span className="tt-ai-launcher-open">
                    <Svg name="chat" />
                </span>
                <span className="tt-ai-launcher-close">
                    <Svg name="minimise" />
                </span>
                <span className="tt-ai-dot" hidden={!unread}>
                    <span className="tt-ai-sr">New reply</span>
                </span>
            </button>

            <section id="tt-ai-panel" className="tt-ai-panel" role="dialog" aria-modal="false" aria-labelledby="tt-ai-title" hidden={!open}>
                <header className="tt-ai-header">
                    <span className="tt-ai-avatar">
                        <Svg name="sparkles" />
                    </span>
                    <div className="tt-ai-heading">
                        <h2 id="tt-ai-title" className="tt-ai-title">
                            Terpaling AI Support
                        </h2>
                        <p className="tt-ai-status">
                            <span className="tt-ai-status-dot" aria-hidden="true" />
                            AI Support Assistant
                        </p>
                    </div>
                    {ready && (
                        <>
                            <button type="button" className="tt-ai-iconbtn" aria-label="Previous conversations" title="Previous conversations" onClick={() => setShowHistory(true)}>
                                <Svg name="history" />
                            </button>
                            <button
                                type="button"
                                className="tt-ai-iconbtn"
                                aria-label="Start a new conversation"
                                title="New conversation"
                                onClick={() => {
                                    if (sending) return;
                                    setActiveId(null);
                                    setShowHistory(false);
                                    setInput('');
                                    inputRef.current?.focus();
                                }}
                            >
                                <Svg name="new" />
                            </button>
                        </>
                    )}
                    <button type="button" className="tt-ai-iconbtn" aria-label="Close chat" title="Close" onClick={closePanel}>
                        <Svg name="close" />
                    </button>
                </header>

                <div className="tt-ai-body">
                    <div className="tt-ai-log" ref={log} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label="Conversation" aria-busy={sending}>
                        <div className="tt-ai-welcome" hidden={messages.length > 0}>
                            <div className="tt-ai-msg tt-ai-msg--assistant">
                                <div className="tt-ai-bubble">
                                    <p>Hi! Welcome to Terpaling Trader 👋</p>
                                    <p>I'm your AI Support Assistant. I can help you with products, subscriptions, payments, downloads, and account-related questions.</p>
                                    <p>How can I help you today?</p>
                                </div>
                            </div>
                            {ready && (
                                <div className="tt-ai-suggestions" role="group" aria-label="Suggested questions">
                                    {SUGGESTIONS.map((s) => (
                                        <button key={s.label} type="button" className="tt-ai-chip" disabled={sending} onClick={() => send(s.question)}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            {messages.map((m, i) => (
                                <div key={i} className={`tt-ai-msg tt-ai-msg--${m.role}`}>
                                    <div className="tt-ai-bubble">
                                        <span className="tt-ai-sr">{m.role === 'user' ? 'You said: ' : 'Terpaling AI Support said: '}</span>
                                        {m.role === 'user' ? m.content : <Markdown text={m.content} />}
                                    </div>
                                    <time className="tt-ai-time" dateTime={m.created_at}>
                                        {formatTime(m.created_at)}
                                    </time>
                                </div>
                            ))}
                        </div>
                        <div className="tt-ai-msg tt-ai-msg--assistant" hidden={!sending}>
                            <div className="tt-ai-bubble tt-ai-typing" role="status">
                                <span aria-hidden="true" />
                                <span aria-hidden="true" />
                                <span aria-hidden="true" />
                                <b className="tt-ai-sr">Terpaling AI Support is typing…</b>
                            </div>
                        </div>
                    </div>

                    {ready && (
                        <div className="tt-ai-history" hidden={!showHistory}>
                            <div className="tt-ai-history-head">
                                <button type="button" className="tt-ai-iconbtn" aria-label="Back to chat" onClick={() => setShowHistory(false)}>
                                    <Svg name="back" />
                                </button>
                                <h3 className="tt-ai-history-title">Previous conversations</h3>
                            </div>
                            <ul className="tt-ai-history-list">
                                {conversations.length === 0 && <li className="tt-ai-history-empty">No previous conversations yet.</li>}
                                {conversations.map((c) => (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            className="tt-ai-history-item"
                                            aria-current={c.id === activeId ? 'true' : undefined}
                                            onClick={() => {
                                                setShowHistory(false);
                                                if (!sending) setActiveId(c.id);
                                            }}
                                        >
                                            <b>{c.title || 'Conversation'}</b>
                                            <span>{formatDate(c.updated_at)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <footer className="tt-ai-footer">
                    {ready ? (
                        <>
                            <form
                                className="tt-ai-form"
                                noValidate
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    send(input);
                                }}
                            >
                                <label htmlFor="tt-ai-input" className="tt-ai-sr">
                                    Message Terpaling AI Support
                                </label>
                                <textarea
                                    ref={inputRef}
                                    id="tt-ai-input"
                                    className="tt-ai-input"
                                    rows={1}
                                    maxLength={MAX_LENGTH}
                                    placeholder="Type your question…"
                                    aria-describedby="tt-ai-hint"
                                    autoComplete="off"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                            e.preventDefault();
                                            send(input);
                                        }
                                    }}
                                />
                                <button type="submit" className="tt-ai-send" aria-label="Send message" disabled={sending || !input.trim()}>
                                    <Svg name="send" />
                                </button>
                            </form>
                            <p id="tt-ai-hint" className="tt-ai-hint">
                                <span>Enter to send · Shift+Enter for a new line</span>
                                <span className={input.length > MAX_LENGTH ? 'is-over' : undefined}>{nearLimit ? `${input.length}/${MAX_LENGTH}` : ''}</span>
                            </p>
                        </>
                    ) : (
                        <div className="tt-ai-notice">
                            <p>Please log in to chat with Terpaling AI Support. Your conversations are saved to your account.</p>
                            <div className="tt-ai-notice-actions">
                                <Link className="tt-ai-btn tt-ai-btn--primary" to="/login">
                                    Log in
                                </Link>
                                <Link className="tt-ai-btn" to="/register">
                                    Create account
                                </Link>
                            </div>
                        </div>
                    )}
                    <p className="tt-ai-disclaimer">AI answers may be inaccurate. This is not financial advice.</p>
                </footer>
            </section>
        </div>
    );
}
