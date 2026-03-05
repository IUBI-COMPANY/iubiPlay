import React from 'react';
import Link from 'next/link';
import LoginForm from '../../../../components/auth/login_form';

export default function LoginPage() {
    return (
        <main className="min-h-screen grid place-items-center px-4">
            <section className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Entrar</h1>
                <LoginForm />
                <p className="mt-4">
                    ¿No tienes cuenta? <Link href="/auth/register" className="text-blue-600">Regístrate</Link>
                </p>
            </section>
        </main>
    );
}
