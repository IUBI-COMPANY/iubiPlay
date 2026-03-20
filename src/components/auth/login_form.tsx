"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/src/lib/supabase/client';
import { useAuthUser } from '@/src/hooks/useAuthUser';

const schema = yup.object({
    email: yup.string().trim().required('Email requerido').email('Email inválido'),
    password: yup.string().required('Contraseña requerida'),
});

type FormData = yup.InferType<typeof schema>;

interface Props {
    redirectTo?: string;
    onSuccess?: (session: Session) => void;
}

export default function LoginForm({ redirectTo, onSuccess }: Props) {
    const router = useRouter();
    const { refresh } = useAuthUser();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        clearErrors,
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
    });

    const [messageError, setMessageError] = React.useState<string | null>(null);

    const onSubmit = async (values: FormData) => {
        setMessageError(null);

        try {
            const res = await fetch('/api/auth/login' + (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: values.email, password: values.password }),
            });

            // Si el backend responde con redirect, forzar navegación para que el navegador setee las cookies
            if (res.redirected && res.url) {
                router.replace(res.url);
                return;
            }

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                setMessageError(json?.message ?? 'Email o contraseña incorrectos');
                return;
            }

            onSuccess?.(null as unknown as Session);
            await refresh();
            router.push(redirectTo ?? '/');
            return;
        } catch {
            setMessageError('Error al iniciar sesión');
        }
    };

    const emailRegister = register('email', {
        onChange: () => {
            if (messageError) setMessageError(null);
            if (errors.email) clearErrors('email');
        },
    });

    const passwordRegister = register('password', {
        onChange: () => {
            if (messageError) setMessageError(null);
            if (errors.password) clearErrors('password');
        },
    });

    const handleGoogleLogin = async () => {
        setMessageError(null);
        const supabase = getBrowserSupabaseClient();
        const nextPath = redirectTo ?? '/';
        const nextParam = encodeURIComponent(nextPath.startsWith('/') ? nextPath : '/');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${nextParam}`,
            },
        });
        if (error) setMessageError(error.message);
    };

    // Password reset
    const [resetEmail, setResetEmail] = React.useState<string>('');
    const [resetSent, setResetSent] = React.useState<boolean>(false);
    const [resetError, setResetError] = React.useState<string | null>(null);
    const handlePasswordReset = async () => {
        setResetError(null);
        setResetSent(false);
        const email = resetEmail || (document.getElementById('login-email') as HTMLInputElement)?.value;
        if (!email) {
            setResetError('Por favor ingresa tu email');
            return;
        }
        const supabase = getBrowserSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/v1/callback`,
        });
        if (error) {
            setResetError(error.message);
        } else {
            setResetSent(true);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {messageError && (
                <div role="alert" aria-live="polite" className="text-sm font-medium p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
                    {messageError}
                </div>
            )}

            <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Email
                </label>
                <div className={`relative group border-b-2 transition-all ${
                  errors.email 
                    ? 'border-red-500' 
                    : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
                }`}>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="Introduce tu email"
                        className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900"
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={254}
                        required
                        {...emailRegister}
                        aria-invalid={!!errors.email}
                    />
                </div>
                {errors.email && (
                    <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label htmlFor="login-password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Contraseña
                    </label>
                    <button
                        type="button"
                        className="text-xs font-semibold text-slate-400 hover:text-violet-600 transition-colors"
                        onClick={() => {
                            const email = (document.getElementById('login-email') as HTMLInputElement)?.value || '';
                            setResetEmail(email);
                            setResetSent(false);
                            setResetError(null);
                            // Show prompt
                            const input = window.prompt('Introduce tu email para recuperar la contraseña:', email);
                            if (input) {
                                setResetEmail(input);
                                handlePasswordReset();
                            }
                        }}
                    >
                        Olvidé mi contraseña
                    </button>
                </div>
                <div className={`relative group border-b-2 transition-all ${
                  errors.password 
                    ? 'border-red-500' 
                    : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
                }`}>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Introduce tu contraseña"
                        className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900"
                        autoComplete="current-password"
                        minLength={8}
                        maxLength={72}
                        required
                        {...passwordRegister}
                        aria-invalid={!!errors.password}
                    />
                </div>
                {errors.password && (
                    <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
                )}
                {resetError && (
                    <p className="text-xs font-medium text-red-500 mt-1">{resetError}</p>
                )}
                {resetSent && (
                    <p className="text-xs font-medium text-green-600 mt-1">Se ha enviado un correo para recuperar tu contraseña.</p>
                )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 flex items-center justify-center rounded-xl bg-[#1a1a1a] dark:bg-white text-white dark:text-slate-900 text-sm font-bold transition-all hover:bg-black dark:hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-black/10"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-inherit" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Iniciando...
                        </span>
                    ) : (
                        'Ingresar ahora'
                    )}
                </button>
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 flex items-center justify-center rounded-xl bg-white text-slate-900 border border-slate-200 text-sm font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-lg shadow-black/10 gap-2"
                >
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.5 24.552C47.5 22.864 47.345 21.232 47.06 19.667H24V28.334H37.06C36.5 31.334 34.5 34.334 31.5 36.334V41.334H39C43.5 37.334 47.5 31.334 47.5 24.552Z" fill="#4285F4"/><path d="M24 48C30.5 48 36 45.667 39.5 41.334L31.5 36.334C29.5 37.667 27 38.334 24 38.334C17.5 38.334 12 33.334 10.5 27.334H2.5V32.667C6 40 14.5 48 24 48Z" fill="#34A853"/><path d="M10.5 27.334C10 25.667 10 24 10 22.334C10 20.667 10 19 10.5 17.334V12H2.5C0.5 16 0.5 20 0.5 24C0.5 28 0.5 32 2.5 36L10.5 27.334Z" fill="#FBBC05"/><path d="M24 9.667C27.5 9.667 30.5 10.667 32.5 12.334L39.5 5.334C36 2.334 30.5 0 24 0C14.5 0 6 8 2.5 16L10.5 24.667C12 18.667 17.5 13.667 24 13.667V9.667Z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><rect width="48" height="48" fill="white"/></clipPath></defs></svg>
                    Ingresar con Google
                </button>
            </div>
        </form>
    );
}
