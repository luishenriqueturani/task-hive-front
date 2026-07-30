"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

const INPUT_CLASSES =
  "w-full rounded-lg border border-app-border bg-app-surface px-2 py-2 text-app-text shadow-sm outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 sm:px-3 sm:py-2.5";

/** Campo de formulário padrão das telas de autenticação (label + input). */
export function FormField({
  id,
  label,
  hint,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-app-text">
        {label}
      </label>
      <input
        id={id}
        className={`${INPUT_CLASSES} mt-1 sm:mt-1.5`}
        {...inputProps}
      />
      {hint ? <p className="mt-1 text-xs text-app-muted">{hint}</p> : null}
    </div>
  );
}

/** Campo de senha com botão para mostrar/ocultar o valor. */
export function PasswordField({
  id,
  label,
  hint,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-app-text">
        {label}
      </label>
      <div className="relative mt-1 sm:mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${INPUT_CLASSES} pr-10`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-app-muted transition hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/50"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
        >
          {visible ? (
            <FaEyeSlash className="h-5 w-5" aria-hidden />
          ) : (
            <FaEye className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1 text-xs text-app-muted">{hint}</p> : null}
    </div>
  );
}

/** Botão de submissão padrão das telas de autenticação. */
export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Alerta de erro dos formulários de autenticação. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-sm text-red-700 dark:text-red-200 sm:px-3 sm:py-2"
      role="alert"
    >
      {message}
    </p>
  );
}
