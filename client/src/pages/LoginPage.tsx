import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
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

const DEMO_CREDENTIALS = { email: "demo@financetrack.app", password: "demo1234" };

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function loginAsDemo() {
    setFormError(null);
    setIsDemoLoading(true);
    try {
      await login(DEMO_CREDENTIALS);
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Demo prihlásenie zlyhalo."));
    } finally {
      setIsDemoLoading(false);
    }
  }

  // Umožňuje priamy odkaz "/login?demo=1" (napr. z CV alebo portfólia), ktorý prihlási
  // rovno na demo účet bez toho, aby návštevník musel čokoľvek vypĺňať alebo klikať.
  useEffect(() => {
    if (searchParams.get("demo") === "1" && !user) {
      void loginAsDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Button
        type="button"
        variant="secondary"
        onClick={() => void loginAsDemo()}
        isLoading={isDemoLoading}
        className="w-full"
      >
        Vyskúšať demo bez registrácie
      </Button>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        alebo sa prihlás vlastným účtom
        <span className="h-px flex-1 bg-slate-200" />
      </div>

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
    </AuthLayout>
  );
}
