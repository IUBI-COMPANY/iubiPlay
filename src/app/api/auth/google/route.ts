
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { setAuthCookies } from '@/src/lib/auth/cookies';
// LOG: inicio endpoint

// Este endpoint ya no es necesario. Todo el flujo OAuth debe pasar por /auth/callback.
import { NextResponse } from 'next/server';

export async function GET() {
  // Redirige a login si alguien accede aquí por error
  return NextResponse.redirect('/auth/login');
}
}
