import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(`Middleware triggered for path: ${request.nextUrl.pathname}`);

  const basicAuth = request.headers.get('authorization');

  if (!basicAuth) {
    console.log('No authorization header found');
    return unauthorized();
  }

  const [scheme, credentials] = basicAuth.split(' ');

  if (scheme !== 'Basic' || !credentials) {
    console.log('Invalid authorization header format');
    return unauthorized();
  }

  const [user, pwd] = atob(credentials).split(':');

  if (user !== process.env.BASIC_AUTH_USER || pwd !== process.env.BASIC_AUTH_PASSWORD) {
    console.log('Invalid credentials');
    return unauthorized();
  }

  console.log('Authentication successful');
  return NextResponse.next();
}

function unauthorized() {
  console.log('Returning 401 Unauthorized response');
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// すべてのページに適用するように設定を変更
export const config = {
  matcher: '/:path*',
};