import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ─── 与 login API 共用同一个密钥逻辑进行 Token 验证 ───────────────────────────
// 注意：这里只做格式验证（Middleware 不能 import server-only 模块）
// 完整的签名密钥校验在 API 层完成

const SECRET = process.env.AUTH_SECRET || '';

function verifyToken(token: string): boolean {
    try {
        const { payload, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
        if (!payload || !sig) return false;
        // 如果有 AUTH_SECRET 环境变量，做 HMAC 校验
        if (SECRET) {
            const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
            const sigBuf = Buffer.from(sig, 'hex');
            const expBuf = Buffer.from(expected, 'hex');
            if (sigBuf.length !== expBuf.length) return false;
            return crypto.timingSafeEqual(sigBuf, expBuf);
        }
        // 无环境变量时：仅检查 token 格式是否完整（开发模式）
        return typeof payload === 'string' && typeof sig === 'string' && payload.length > 0 && sig.length === 64;
    } catch {
        return false;
    }
}

// ─── 需要保护的路由（排除静态资源、登录页、API）──────────────────────────────
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 放行：登录页、Auth API、Next.js 内部路由、静态资源
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth/') ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/api/') === false && pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // API 路由（parse、agent）需要登录才能访问
    const session = req.cookies.get('link2md_session');

    if (!session?.value || !verifyToken(session.value)) {
        // API 请求返回 401，页面请求跳转登录
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 添加安全 Headers
    const res = NextResponse.next();
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
    );
    return res;
}

export const config = {
    matcher: [
        // 匹配所有路由，除了 Next.js 内部静态文件
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
