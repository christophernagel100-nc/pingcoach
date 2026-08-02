import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that never need auth state — skip Supabase entirely so crawler/bot
// traffic on these (esp. /wissen, /sitemap.xml) can't hang the whole edge
// function on a slow Supabase response (cause of MIDDLEWARE_INVOCATION_TIMEOUT).
const FULLY_PUBLIC_PATHS = [
  '/',
  '/api/auth',
  '/api/waitlist',
  '/wissen',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
]

// Public, but still need to know auth state (redirect logged-in users away).
const AUTH_AWARE_PUBLIC_PATHS = ['/login', '/register']

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

export async function middleware(request: NextRequest) {
  if (matchesPath(request.nextUrl.pathname, FULLY_PUBLIC_PATHS)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Bounded wait: a slow/unreachable Supabase must never hang the whole edge
  // function (that's what caused MIDDLEWARE_INVOCATION_TIMEOUT). Fail closed
  // (treat as logged-out) after 5s instead of blocking indefinitely.
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
  const userPromise = supabase.auth.getUser().then((result) => result.data.user)
  const user = await Promise.race([userPromise, timeout])

  const isPublic = matchesPath(request.nextUrl.pathname, AUTH_AWARE_PUBLIC_PATHS)

  // Protected routes: redirect to login if not authenticated
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login/register
  if (
    user &&
    (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
