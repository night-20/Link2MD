"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Loader2, ArrowRight, Menu, X, Key, Send, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Provider Config ─────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    keyPlaceholder: 'AIza...',
    keyHint: 'aistudio.google.com/app/apikey',
    keyHintUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.openai.com/api-keys',
    keyHintUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'o3-mini', name: 'o3-mini' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'console.anthropic.com/settings/keys',
    keyHintUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.deepseek.com/api_keys',
    keyHintUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ],
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    keyPlaceholder: '请输入 API Key...',
    keyHint: 'bigmodel.cn/usercenter/apikeys',
    keyHintUrl: 'https://bigmodel.cn/usercenter/apikeys',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4-Flash（免费）' },
      { id: 'glm-4-air', name: 'GLM-4-Air' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus' },
    ],
  },
] as const;
type ProviderId = typeof PROVIDERS[number]['id'];


// ─── Main Page Component ──────────────────────────────────────────────────────
export default function Home() {
  // ── Converter State ──
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Sidebar / Agent State ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider)!;

  // ── Chat State ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  // Track whether article markdown has already been sent to the API in this session.
  // After the first send, we DON'T include it again to save tokens.
  const [articleContextSent, setArticleContextSent] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // ── Converter Handlers ──
  const handleParse = async () => {
    if (!url) return;
    setIsLoading(true);
    setError('');
    setMarkdown('');
    setTitle('');

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解析失败');
      setMarkdown(data.content);
      setTitle(data.title || '文章');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    alert('Markdown 已复制到剪贴板！');
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[\\/:*?"<>|]/g, '_') || '文章'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── API Key Handler ──
  const handleSetApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setApiKeyError('请输入有效的 API Key');
      return;
    }
    if (trimmed.length < 10) {
      setApiKeyError('API Key 长度不足，请检查后重新输入');
      return;
    }
    setApiKey(trimmed);
    setApiKeySet(true);
    setApiKeyError('');
    setShowApiKeyInput(false);
    const providerName = currentProvider.name;
    const modelName = currentProvider.models.find(m => m.id === selectedModel)?.name || selectedModel;
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `您好！我是**文章分析 Agent**，当前使用 **${providerName} · ${modelName}** 驱动。\n\n我可以对您在主页面转换的文章进行专业分析。您可以：\n- 直接问我「分析这篇文章」，我会自动读取当前已转换的文章\n- 指定分析角度，如「分析论证逻辑」或「评估可信度」\n- 进行多轮深度讨论\n\n请告诉我您希望如何分析？`
    }]);
  };

  const handleChangeApiKey = () => {
    setApiKeyInput(apiKey);
    setShowApiKeyInput(true);
    setApiKeySet(false);
    setApiKeyError('');
    setArticleContextSent(false);
    setMessages([]);
  };

  const handleProviderChange = (newProvider: ProviderId) => {
    setSelectedProvider(newProvider);
    const p = PROVIDERS.find(x => x.id === newProvider)!;
    setSelectedModel(p.models[0].id);
    setApiKeyInput('');
    setApiKeyError('');
    setArticleContextSent(false);
    setMessages([]);
  };

  // ── Chat Handler ──
  const sendMessage = async (text: string, currentMessages: ChatMessage[]) => {
    const newMessages: ChatMessage[] = [...currentMessages, { role: 'user', content: text }];
    setMessages(newMessages);
    setChatInput('');
    setChatError('');
    setIsChatLoading(true);

    // Only pass article markdown content on the FIRST message (to save tokens).
    // After that, the AI already has the context.
    const shouldSendContext = markdown && !articleContextSent;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: selectedProvider,
          model: selectedModel,
          message: text,
          articleContent: shouldSendContext ? markdown : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');

      if (shouldSendContext) setArticleContextSent(true);
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setChatError(err.message);
      setMessages(currentMessages); // revert optimistic update
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isChatLoading) return;
    await sendMessage(trimmed, messages);
  };

  // One-click quick-analyze button handler
  const handleQuickAnalyze = async () => {
    if (!markdown || isChatLoading) return;
    const prompt = '请对这篇文章进行全面深度分析，包括概述、优点、局限性与可信度评估。';
    // Show user message immediately
    const withUser: ChatMessage[] = [...messages, { role: 'user', content: '分析当前文章' }];
    setMessages(withUser);
    setIsChatLoading(true);
    setChatError('');

    const shouldSendContext = !articleContextSent;
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: selectedProvider,
          model: selectedModel,
          message: prompt,
          articleContent: shouldSendContext ? markdown : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      if (shouldSendContext) setArticleContextSent(true);
      setMessages([...withUser, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setChatError(err.message);
      setMessages(messages);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8' }}>

      {/* ── Sidebar Overlay ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar Panel ── */}
      <aside className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #d4cfc9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #d97757, #c56b4d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#2d2d2d' }}>文章分析 Agent</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9a9490' }}>由 {currentProvider.name} 驱动</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9a9490', borderRadius: 6, padding: 4,
              display: 'flex', alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2d2d2d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a9490')}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── API Key Section ── */}
        {!apiKeySet || showApiKeyInput ? (
          <div style={{ padding: '20px 20px', overflowY: 'auto', flex: 1 }}>
            {/* Info Banner */}
            <div style={{
              background: '#fff8f5',
              border: '1px solid #f0d8ce',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Key size={15} style={{ color: '#d97757', marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#7a7470', lineHeight: 1.65 }}>
                请选择 AI 提供商并填写对应的 API Key 以启动 Agent。密鑰仅在本地会话使用，不会被存储或上传。
              </p>
            </div>

            {/* ── Provider Selector ── */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              AI 提供商
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id as ProviderId)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1.5px solid ${selectedProvider === p.id ? '#d97757' : '#d4cfc9'}`,
                    background: selectedProvider === p.id ? '#fff0eb' : '#faf8f5',
                    color: selectedProvider === p.id ? '#d97757' : '#6a6460',
                    fontWeight: selectedProvider === p.id ? 700 : 500,
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                    transition: 'all 0.15s',
                    lineHeight: 1.3,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* ── Model Selector ── */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              模型
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #d4cfc9',
                background: '#faf8f5',
                fontSize: 13,
                color: '#2d2d2d',
                outline: 'none',
                marginBottom: 16,
                cursor: 'pointer',
              }}
            >
              {currentProvider.models.map((m: { id: string; name: string }) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* ── API Key Input ── */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              {currentProvider.name} API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKeyInput}
              onChange={e => { setApiKeyInput(e.target.value); setApiKeyError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSetApiKey()}
              placeholder={currentProvider.keyPlaceholder}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1.5px solid ${apiKeyError ? '#e57373' : '#d4cfc9'}`,
                background: '#faf8f5',
                fontSize: 14,
                color: '#2d2d2d',
                outline: 'none',
                marginBottom: 8,
                fontFamily: 'monospace',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
              onBlur={e => (e.currentTarget.style.borderColor = apiKeyError ? '#e57373' : '#d4cfc9')}
            />

            {apiKeyError && (
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#e57373', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> {apiKeyError}
              </p>
            )}

            <p style={{ margin: '0 0 16px', fontSize: 11, color: '#b0aaa3' }}>
              获取密鑰：
              <a href={currentProvider.keyHintUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: '#d97757', textDecoration: 'none' }}>
                {currentProvider.keyHint}
              </a>
            </p>

            <button
              id="set-api-key-btn"
              onClick={handleSetApiKey}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #d97757, #c56b4d)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              启动 Agent
            </button>
          </div>
        ) : (
          /* ── Chat Interface ── */
          <>
            {/* Status Bar */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #d4cfc9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f0ede8',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} color="#4caf50" />
                <span style={{ fontSize: 12, color: '#5a9a5a', fontWeight: 500 }}>Agent 已就绪</span>
                <span style={{ fontSize: 11, color: '#b0aaa3' }}>·</span>
                <span style={{ fontSize: 11, color: '#b0aaa3' }}>{currentProvider.name}</span>
              </div>
              <button
                onClick={handleChangeApiKey}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#9a9490', padding: '2px 6px',
                  borderRadius: 4, transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d97757')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9a9490')}
              >
                更换密钥
              </button>
            </div>

            {/* Article Context Panel – shown when markdown is loaded */}
            {markdown && (
              <div style={{
                margin: '12px 16px 0',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fff8f5',
                border: '1px solid #f0d8ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#c56b4d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {title || '已爬取文章'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#b0aaa3' }}>
                      {articleContextSent ? '✓ 已发送给 Agent' : `Markdown · ${Math.round(markdown.length / 100) / 10}k 字符`}
                    </p>
                  </div>
                </div>
                <button
                  id="quick-analyze-btn"
                  onClick={handleQuickAnalyze}
                  disabled={isChatLoading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: isChatLoading ? '#e0dbd5' : 'linear-gradient(135deg, #d97757, #c56b4d)',
                    color: isChatLoading ? '#b0aaa3' : 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isChatLoading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { if (!isChatLoading) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {articleContextSent ? '继续分析' : '一键分析'}
                </button>
              </div>
            )}

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 16px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {messages.map((msg, i) => (
                <div key={i} className="chat-message" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'linear-gradient(135deg, #d97757, #c56b4d)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Bot size={12} color="white" />
                      </div>
                      <span style={{ fontSize: 11, color: '#9a9490', fontWeight: 500 }}>文章分析 Agent</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '88%',
                    padding: msg.role === 'user' ? '9px 14px' : '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #d97757, #c56b4d)'
                      : '#ffffff',
                    color: msg.role === 'user' ? 'white' : '#2d2d2d',
                    fontSize: 13,
                    lineHeight: 1.65,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: msg.role === 'assistant' ? '1px solid #e8e4df' : 'none',
                  }}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none" style={{ fontSize: 13, lineHeight: 1.7 }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isChatLoading && (
                <div className="chat-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: 'linear-gradient(135deg, #d97757, #c56b4d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={12} color="white" />
                    </div>
                    <span style={{ fontSize: 11, color: '#9a9490', fontWeight: 500 }}>分析中…</span>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '4px 16px 16px 16px',
                    background: '#ffffff',
                    border: '1px solid #e8e4df',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    display: 'flex', gap: 5, alignItems: 'center',
                  }}>
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97757', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97757', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97757', display: 'inline-block' }} />
                  </div>
                </div>
              )}

              {/* Chat Error */}
              {chatError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#fff5f5',
                  border: '1px solid #ffd0d0',
                  color: '#e57373',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{
              padding: '12px 16px 16px',
              borderTop: '1px solid #d4cfc9',
              background: '#e8e4df',
            }}>
              {!markdown && (
                <p style={{
                  margin: '0 0 8px',
                  fontSize: 11,
                  color: '#b0aaa3',
                  textAlign: 'center',
                }}>
                  💡 提示：先在主页面转换文章，Agent 即可对文章内容进行分析
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  id="chat-input"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={markdown ? "分析这篇文章的论点…" : "输入您的问题（Enter 发送）…"}
                  disabled={isChatLoading}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #d4cfc9',
                    background: '#faf8f5',
                    fontSize: 13,
                    color: '#2d2d2d',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                    maxHeight: 100,
                    overflowY: 'auto',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4cfc9')}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                  }}
                />
                <button
                  id="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    border: 'none',
                    background: isChatLoading || !chatInput.trim()
                      ? '#e0dbd5'
                      : 'linear-gradient(135deg, #d97757, #c56b4d)',
                    color: isChatLoading || !chatInput.trim() ? '#b0aaa3' : 'white',
                    cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.2s, transform 0.1s',
                  }}
                  onMouseDown={e => { if (!isChatLoading && chatInput.trim()) e.currentTarget.style.transform = 'scale(0.93)'; }}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isChatLoading
                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={16} />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main style={{ minHeight: '100vh', padding: '40px 16px', position: 'relative' }}>

        {/* Hamburger menu button (top-left) */}
        <button
          id="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(true)}
          title="打开文章分析 Agent"
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 30,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1.5px solid #d4cfc9',
            background: '#e8e4df',
            color: '#5a5550',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s, transform 0.1s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#d97757';
            e.currentTarget.style.borderColor = '#d97757';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#e8e4df';
            e.currentTarget.style.borderColor = '#d4cfc9';
            e.currentTarget.style.color = '#5a5550';
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Menu size={20} />
        </button>

        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: '#d97757',
              fontFamily: 'Georgia, serif',
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}>
              Link2MD
            </h1>
            <p style={{ color: '#9a9490', fontWeight: 500, letterSpacing: '0.02em', margin: 0, fontSize: 15 }}>
              一键将网络文章转换为干净的 Markdown 格式。
            </p>
          </div>

          {/* ── Input Area ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            maxWidth: 760,
            margin: '0 auto 24px',
          }}>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && url && handleParse()}
              placeholder="在此粘贴链接 (支持微信公众号, CSDN, 掘金, 牛客网)..."
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: 12,
                border: '1.5px solid #d4cfc9',
                background: '#ffffff',
                fontSize: 14,
                color: '#2d2d2d',
                outline: 'none',
                fontWeight: 500,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#d97757';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(217, 119, 87, 0.12)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d4cfc9';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
              }}
              disabled={isLoading}
            />
            <button
              id="parse-btn"
              onClick={handleParse}
              disabled={isLoading || !url}
              style={{
                padding: '13px 24px',
                borderRadius: 12,
                border: 'none',
                background: isLoading || !url
                  ? '#e0dbd5'
                  : 'linear-gradient(135deg, #d97757, #c56b4d)',
                color: isLoading || !url ? '#b0aaa3' : 'white',
                fontWeight: 700,
                fontSize: 14,
                cursor: isLoading || !url ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 140,
                justifyContent: 'center',
                boxShadow: isLoading || !url ? 'none' : '0 2px 8px rgba(217, 119, 87, 0.30)',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
              }}
              onMouseDown={e => { if (!isLoading && url) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  正在解析…
                </>
              ) : (
                <>
                  开始转换
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* ── Error Message ── */}
          {error && (
            <div style={{
              padding: '12px 20px',
              borderRadius: 12,
              background: '#fff5f5',
              border: '1px solid #ffd0d0',
              color: '#e57373',
              maxWidth: 760,
              margin: '0 auto 24px',
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* ── Content Area ── */}
          {markdown && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              height: '70vh',
            }}>
              {/* Editor / Source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b0aaa3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Markdown 源码
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      id="copy-btn"
                      onClick={handleCopy}
                      title="复制到剪贴板"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#b0aaa3', padding: 6, borderRadius: 6,
                        display: 'flex', alignItems: 'center',
                        transition: 'color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#d97757'; e.currentTarget.style.background = '#f0ede8'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#b0aaa3'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      id="download-btn"
                      onClick={handleDownload}
                      title="下载 .md 文件"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#b0aaa3', padding: 6, borderRadius: 6,
                        display: 'flex', alignItems: 'center',
                        transition: 'color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#d97757'; e.currentTarget.style.background = '#f0ede8'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#b0aaa3'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <textarea
                  id="markdown-source"
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    borderRadius: 14,
                    border: '1.5px solid #d4cfc9',
                    background: '#ffffff',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#3e3e3e',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4cfc9')}
                />
              </div>

              {/* Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                <div style={{ padding: '0 4px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b0aaa3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    预览
                  </span>
                </div>
                <div style={{
                  flex: 1,
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: 14,
                  border: '1.5px solid #d4cfc9',
                  background: '#ffffff',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  overflowY: 'auto',
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: '#2d2d2d',
                }}>
                  <div className="prose prose-stone max-w-none prose-img:rounded-lg prose-headings:font-serif prose-a:text-[#d97757]">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
