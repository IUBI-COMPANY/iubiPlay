import React from 'react';
import Link from 'next/link';
import RegisterForm from '../../../../components/auth/register_form';

export default function RegisterPage() {
    return (
        <main className="min-h-screen grid place-items-center px-4">
            <section className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>
                <RegisterForm />
                <p className="mt-4">
                    ¿Ya tienes cuenta? <Link href="/auth/login" className="text-blue-600">Entrar</Link>
                </p>
            </section>
        </main>
    );
}
