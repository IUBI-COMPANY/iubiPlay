import React from 'react';
import Link from 'next/link';
import LoginForm from '../../../../components/auth/login_form';

type Props = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirectTo } = await searchParams;

  return (
    <main className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Entrar</h1>
      <LoginForm redirectTo={redirectTo} />
      <p className="mt-4">
        ¿No tienes cuenta? <Link href="/auth/register" className="text-blue-600">Regístrate</Link>
      </p>
    </main>
  );
}
