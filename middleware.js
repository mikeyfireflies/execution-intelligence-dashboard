import { NextResponse } from 'next/server';

export function middleware(req) {
    // Only run in production or when env vars are set
    const basicAuthUser = process.env.BASIC_AUTH_USER;
    const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

    // Allow MCP API routes to bypass basic auth
    if (req.nextUrl.pathname.startsWith('/api/mcp')) {
        return NextResponse.next();
    }

    if (!basicAuthUser || !basicAuthPassword) {
        return NextResponse.next();
    }

    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        if (user === basicAuthUser && pwd === basicAuthPassword) {
            return NextResponse.next();
        }
    }

    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
        },
    });
}

export const config = {
    matcher: '/:path*',
};
