"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  email: yup.string().trim().required('Email requerido').email('Email inválido'),
  password: yup.string().required('Contraseña requerida').min(8, 'Mínimo 8 caracteres'),
  confirmPassword: yup
    .string()
    .required('Confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

type FormData = yup.InferType<typeof schema>;

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export default function RegisterForm() {
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
  const [messageSuccess, setMessageSuccess] = React.useState<string | null>(null);

  const onSubmit = async (values: FormData) => {
    setMessageError(null);
    setMessageSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok) {
        setMessageError(json?.message ?? 'No se pudo registrar');
        return;
      }

      setMessageSuccess(json?.message ?? 'Revisa tu correo para continuar');
    } catch {
      setMessageError('Error al registrar');
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

  const confirmRegister = register('confirmPassword', {
    onChange: () => {
      if (messageError) setMessageError(null);
      if (errors.confirmPassword) clearErrors('confirmPassword');
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {messageError && (
        <div role="alert" aria-live="polite" className="text-red-600">
          {messageError}
        </div>
      )}
      {messageSuccess && (
        <div role="status" aria-live="polite" className="text-green-600">
          {messageSuccess}
        </div>
      )}

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          className={inputClass}
          autoComplete="email"
          required
          {...emailRegister}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="register-password"
          type="password"
          className={inputClass}
          autoComplete="new-password"
          required
          {...passwordRegister}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="block text-sm font-medium">
          Confirmar contraseña
        </label>
        <input
          id="register-confirm-password"
          type="password"
          className={inputClass}
          autoComplete="new-password"
          required
          {...confirmRegister}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>
      </div>
    </form>
  );
}
