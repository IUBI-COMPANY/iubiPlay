"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: values.email, password: values.password }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                setMessageError(json?.message ?? 'Email o contraseña incorrectos');
                return;
            }

            onSuccess?.(null as unknown as Session);
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
                        className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        autoComplete="email"
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
                    <button type="button" className="text-xs font-semibold text-slate-400 hover:text-violet-600 transition-colors">
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
                        className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        autoComplete="current-password"
                        required
                        {...passwordRegister}
                        aria-invalid={!!errors.password}
                    />
                </div>
                {errors.password && (
                    <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
                )}
            </div>

            <div className="pt-4">
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
            </div>
        </form>
    );
}
