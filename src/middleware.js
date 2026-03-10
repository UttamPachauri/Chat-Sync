import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
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

  // IMPORTANT: Always use getUser() (not getSession()) in middleware —
  // getUser() validates the token server-side on every request.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  const { pathname } = request.nextUrl

  // ── Root "/" → route based on auth ─────────────────────────────────────
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/chat' : '/auth/login'
    return NextResponse.redirect(url)
  }

  // ── Protect /chat — unauthenticated → login ────────────────────────────
  if (!user && pathname.startsWith('/chat')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // ── Protect /auth — authenticated → chat (except OAuth callback) ────────
  if (
    user &&
    pathname.startsWith('/auth') &&
    !pathname.includes('/callback') &&
    !pathname.includes('/update-password')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Include root "/" so the middleware can handle the landing redirect
  matcher: ['/', '/chat/:path*', '/auth/:path*'],
}
