import React from 'react';
import RegisterForm from '../../../../components/auth/register_form';

export default function RegisterPage() {
  return (
    <main className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>
      <RegisterForm />
      <p className="mt-4">
        ¿Ya tienes cuenta? <a href="/auth/login" className="text-blue-600">Entrar</a>
      </p>
    </main>
  );
}
