import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/api/client";

const loginFormSchema = z.object({
  email: z.string().email("Zadaj platný e-mail."),
  password: z.string().min(1, "Zadaj heslo."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Prihlásenie zlyhalo."));
    }
  }

  return (
    <AuthLayout title="Prihlásenie" subtitle="Prihlás sa a spravuj svoje financie">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Heslo"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Prihlásiť sa
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Nemáš účet?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Zaregistruj sa
        </Link>
      </p>
      <p className="mt-3 rounded-lg bg-slate-50 p-2 text-center text-xs text-slate-400">
        Demo účet: demo@financetrack.app / demo1234
      </p>
    </AuthLayout>
  );
}
