import React from 'react';
import RegisterForm from '../../../../components/auth/register_form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="fixed inset-0 z-[100] flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* Botón para volver a la web principal */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a la web
        </Link>
      </div>

      {/* Left Side: Brand & Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-16 bg-[#3d44e6] overflow-hidden">
        {/* Abstract Background Design - Curved Lines like in the image */}
        <div className="absolute inset-0 pointer-events-none stroke-white/5 opacity-50">
          <svg className="absolute top-0 right-0 h-full w-[150%] translate-x-1/4" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100 0 C 80 20 80 50 100 100" fill="none" stroke="currentColor" strokeWidth="0.1" />
            <path d="M100 10 C 70 30 70 60 100 90" fill="none" stroke="currentColor" strokeWidth="0.1" />
            <path d="M100 20 C 60 40 60 70 100 80" fill="none" stroke="currentColor" strokeWidth="0.1" />
            <path d="M100 30 C 50 50 50 80 100 70" fill="none" stroke="currentColor" strokeWidth="0.1" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Asterisk-like Logo Icon from the image */}
          <div className="text-white opacity-90 mb-12 animate-in fade-in duration-1000">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="20" y1="12" x2="4" y2="12" />
              <line x1="18" y1="18" x2="6" y2="6" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            <h1 className="text-7xl font-bold text-white leading-[1.05] tracking-tight">
              Bienvenido <br /> a IUBIPLAY!
            </h1>
            <p className="mt-10 text-xl text-white/70 leading-relaxed font-normal max-w-sm">
              Simplifica tu aprendizaje con recursos interactivos. Únete para colaborar y registrar nuevos juegos increíbles.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/30 font-medium uppercase tracking-widest">
          © 2026 IUBIPLAY. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-8 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-12 duration-1000">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">¡Únete ahora!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/auth/login"
                className="text-slate-900 dark:text-white font-bold underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Inicia sesión aquí
              </Link>
              . Solo toma unos segundos comenzar.
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
