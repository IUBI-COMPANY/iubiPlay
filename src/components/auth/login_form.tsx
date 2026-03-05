"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Session } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '../../lib/supabase/client';
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
            const supabase = getBrowserSupabaseClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email ?? '',
                password: values.password ?? '',
            });

            if (error) {
                setMessageError(
                    process.env.NODE_ENV !== 'production'
                        ? error.message
                        : 'Email o contraseña incorrectos'
                );
                return;
            }

            if (data?.session) {
                onSuccess?.(data.session);
                router.push(redirectTo ?? '/');
                return;
            }

            setMessageError('No se pudo iniciar sesión');
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {messageError && (
                <div role="alert" aria-live="polite" className="text-red-600">
                    {messageError}
                </div>
            )}

            <div>
                <label htmlFor="login-email" className="block text-sm font-medium">
                    Email
                </label>
                <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    {...emailRegister}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    aria-invalid={!!errors.email}
                />
                {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="login-password" className="block text-sm font-medium">
                    Contraseña
                </label>
                <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    {...passwordRegister}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    aria-invalid={!!errors.password}
                />
                {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            <div>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
            </div>
        </form>
    );
}
