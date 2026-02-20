import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ success: true });
    // 清除 Session Cookie
    res.cookies.set('link2md_session', '', {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
    return res;
}
