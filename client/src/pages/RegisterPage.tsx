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

const registerFormSchema = z.object({
  name: z.string().min(2, "Meno musí mať aspoň 2 znaky."),
  email: z.string().email("Zadaj platný e-mail."),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov."),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerUser(values);
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Registrácia zlyhala."));
    }
  }

  return (
    <AuthLayout title="Vytvoriť účet" subtitle="Začni sledovať svoje príjmy a výdavky">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Meno" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Heslo"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Zaregistrovať sa
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Už máš účet?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Prihlás sa
        </Link>
      </p>
    </AuthLayout>
  );
}
