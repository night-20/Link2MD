"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, LogIn, Eye, EyeOff } from 'lucide-react';

// ─── 生成随机验证码字符串 ────────────────────────────────────────────────────
function generateCaptchaText(length = 4): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── 在 Canvas 上绘制验证码 ──────────────────────────────────────────────────
function drawCaptcha(canvas: HTMLCanvasElement, text: string) {
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#f5f0eb';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * W, Math.random() * H);
        ctx.lineTo(Math.random() * W, Math.random() * H);
        ctx.strokeStyle = `hsla(${Math.random() * 360},60%,70%,0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `hsla(${Math.random() * 360},60%,60%,0.4)`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    text.split('').forEach((char, i) => {
        ctx.save();
        const x = 16 + i * 22;
        const y = H / 2 + 6;
        const angle = (Math.random() - 0.5) * 0.4;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.font = `bold ${22 + Math.random() * 6}px 'Courier New', monospace`;
        ctx.fillStyle = `hsl(${Math.random() * 60 + 10},60%,35%)`;
        ctx.fillText(char, 0, 0);
        ctx.restore();
    });
}

// ─── 登录页组件 ──────────────────────────────────────────────────────────────
export default function LoginPage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [captchaText, setCaptchaText] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const refreshCaptcha = useCallback(() => {
        const text = generateCaptchaText();
        setCaptchaText(text);
        setCaptchaInput('');
    }, []);

    useEffect(() => {
        if (canvasRef.current && captchaText) {
            drawCaptcha(canvasRef.current, captchaText);
        }
    }, [captchaText]);

    useEffect(() => { refreshCaptcha(); }, [refreshCaptcha]);

    // ── 调用服务端 API，凭证不在客户端校验 ──
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
            setError('验证码错误，请重新输入');
            refreshCaptcha();
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '登录失败');
                refreshCaptcha();
                return;
            }

            // Cookie 由服务端 httpOnly Set-Cookie 写入，前端无需操作
            router.push('/');
        } catch {
            setError('网络错误，请稍后重试');
            refreshCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0ede8 0%, #e8e4df 50%, #f5f0eb 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>

            <div style={{
                width: '100%',
                maxWidth: 420,
                background: '#ffffff',
                borderRadius: 20,
                boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #d97757, #c56b4d)',
                    padding: '32px 32px 28px',
                    textAlign: 'center',
                }}>
                    <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 800, color: '#ffffff', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
                        Link2MD
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                        请登录以继续使用
                    </p>
                </div>

                {/* autocomplete="off" 阻止浏览器密码管理器触发数据泄露提示 */}
                <form onSubmit={handleLogin} autoComplete="off" style={{ padding: '28px 32px 24px' }}>
                    {/* 蜜罐字段，迷惑浏览器自动填充 */}
                    <input type="text" name="fake_user" style={{ display: 'none' }} tabIndex={-1} readOnly />
                    <input type="password" name="fake_pass" style={{ display: 'none' }} tabIndex={-1} readOnly />

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>用户名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError(''); }}
                            placeholder="请输入用户名"
                            autoComplete="off"
                            required
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #d4cfc9', background: '#faf8f5', fontSize: 14, color: '#2d2d2d', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                            onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
                            onBlur={e => (e.currentTarget.style.borderColor = '#d4cfc9')}
                        />
                    </div>

                    {/* autocomplete="new-password" 告知浏览器不要对此字段进行泄露检测 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>密码</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                placeholder="请输入密码"
                                autoComplete="new-password"
                                required
                                style={{ width: '100%', padding: '11px 14px', paddingRight: '40px', borderRadius: 10, border: '1.5px solid #d4cfc9', background: '#faf8f5', fontSize: 14, color: '#2d2d2d', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#d4cfc9')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#b0aaa3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    zIndex: 1,
                                }}
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6460', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>验证码</label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={e => { setCaptchaInput(e.target.value); setError(''); }}
                                placeholder="请输入验证码"
                                maxLength={4}
                                autoComplete="off"
                                required
                                style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #d4cfc9', background: '#faf8f5', fontSize: 14, color: '#2d2d2d', outline: 'none', letterSpacing: '0.15em', fontFamily: 'monospace', transition: 'border-color 0.2s' }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#d97757')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#d4cfc9')}
                            />
                            <div onClick={refreshCaptcha} title="点击刷新验证码" style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                                <canvas
                                    ref={canvasRef}
                                    width={110}
                                    height={42}
                                    style={{ borderRadius: 8, border: '1.5px solid #d4cfc9', display: 'block', userSelect: 'none' }}
                                />
                                <div style={{ position: 'absolute', bottom: 3, right: 4, color: 'rgba(0,0,0,0.3)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <RefreshCw size={8} /><span>换一张</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: '#fff5f5', border: '1px solid #ffd0d0', color: '#e57373', fontSize: 13, marginBottom: 16 }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />{error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#e0dbd5' : 'linear-gradient(135deg, #d97757, #c56b4d)', color: loading ? '#b0aaa3' : 'white', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s, transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 2px 12px rgba(217, 119, 87, 0.35)' }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <LogIn size={16} />
                        {loading ? '登录中…' : '登 录'}
                    </button>
                </form>
            </div>

            <div style={{ marginTop: 28, maxWidth: 420, width: '100%', textAlign: 'center', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,207,201,0.6)', backdropFilter: 'blur(8px)' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#9a9490', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 600, color: '#b0aaa3' }}>⚠️ 免责声明</span><br />
                    本网站由个人出于兴趣爱好搭建，内容仅供学习与技术交流使用。<br />
                    请勿将本站用于任何商业、娱乐或其他违规目的。<br />
                    使用本站即表示您已阅读并同意以上声明。
                </p>
            </div>
        </div>
    );
}
