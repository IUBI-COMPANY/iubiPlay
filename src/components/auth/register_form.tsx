"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  username: yup
    .string()
    .transform((value) => value.trim().toLowerCase())
    .required('Nombre de usuario requerido')
    .min(3, 'Minimo 3 caracteres')
    .max(20, 'Maximo 20 caracteres')
    .matches(/^[a-z0-9_]+$/, 'Solo letras, numeros y guion bajo'),
  email: yup.string().trim().required('Email requerido').email('Email invalido'),
  password: yup.string().required('Contrasena requerida').min(8, 'Minimo 8 caracteres'),
  confirmPassword: yup
    .string()
    .required('Confirma tu contrasena')
    .oneOf([yup.ref('password')], 'Las contrasenas no coinciden'),
});

type FormData = yup.InferType<typeof schema>;



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
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
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

  const usernameRegister = register('username', {
    onChange: () => {
      if (messageError) setMessageError(null);
      if (errors.username) clearErrors('username');
    },
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {messageError && (
        <div role="alert" aria-live="polite" className="text-sm font-medium p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
          {messageError}
        </div>
      )}
      {messageSuccess && (
        <div role="status" aria-live="polite" className="text-sm font-medium p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
          {messageSuccess}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="register-username" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Nombre de usuario
        </label>
        <div className={`relative group border-b-2 transition-all ${
          errors.username 
            ? 'border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
        }`}>
          <input
            id="register-username"
            type="text"
            placeholder="Elige un nombre de usuario"
            className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
            autoComplete="username"
            required
            {...usernameRegister}
            aria-invalid={!!errors.username}
          />
        </div>
        {errors.username && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Correo electrónico
        </label>
        <div className={`relative group border-b-2 transition-all ${
          errors.email 
            ? 'border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
        }`}>
          <input
            id="register-email"
            type="email"
            placeholder="Introduce tu correo"
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
        <label htmlFor="register-password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Contraseña
        </label>
        <div className={`relative group border-b-2 transition-all ${
          errors.password 
            ? 'border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
        }`}>
          <input
            id="register-password"
            type="password"
            placeholder="Crea una contraseña segura"
            className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
            autoComplete="new-password"
            required
            {...passwordRegister}
            aria-invalid={!!errors.password}
          />
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-confirm-password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Confirmar contraseña
        </label>
        <div className={`relative group border-b-2 transition-all ${
          errors.confirmPassword 
            ? 'border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus-within:border-violet-600 dark:focus-within:border-violet-400'
        }`}>
          <input
            id="register-confirm-password"
            type="password"
            placeholder="Repite tu contraseña"
            className="w-full bg-transparent px-0 py-3 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
            autoComplete="new-password"
            required
            {...confirmRegister}
            aria-invalid={!!errors.confirmPassword}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.confirmPassword.message}</p>
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
              Creando cuenta...
            </span>
          ) : (
            'Registrarse ahora'
          )}
        </button>
      </div>
    </form>
  );
}
