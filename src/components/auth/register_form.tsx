"use client";

import React from 'react';

export default function RegisterForm() {
    return (
        <form className="space-y-4" noValidate>
            <div>
                <label htmlFor="register-email" className="block text-sm font-medium">
                    Email
                </label>
                <input
                    id="register-email"
                    type="email"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="email"
                    required
                />
            </div>

            <div>
                <label htmlFor="register-password" className="block text-sm font-medium">
                    Contraseña
                </label>
                <input
                    id="register-password"
                    type="password"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="new-password"
                    required
                />
            </div>

            <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium">
                    Confirmar contraseña
                </label>
                <input
                    id="register-confirm-password"
                    type="password"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="new-password"
                    required
                />
            </div>

            <div>
                <button type="submit" className="btn-primary">
                    Registrarse
                </button>
            </div>
        </form>
    );
}
