import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandLogo } from "@/components/brand/brand-logo";
import { entraEnabled } from "@/features/auth/auth-config";
import { entraErrorMessage } from "@/features/auth/entra-error-messages";
import { isSafeRedirectPath } from "@/features/auth/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata = { title: "Aanmelden - Floriday middleware" };

interface LoginPageProps {
  searchParams: Promise<{ fout?: string; verder?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const verder = params.verder && isSafeRedirectPath(params.verder) ? params.verder : "";
  const entraError = entraErrorMessage(params.fout);

  return (
    <AuthShell backgroundImage="/brand/backgrounds/default.jpg" overlay="light">
      <Card>
        <CardHeader className="justify-items-center gap-3 text-center">
          <BrandLogo
            src="/brand/logos/coloriginz.png"
            alt="Coloriginz"
            variant="plain"
            size="h-9"
          />
          <CardTitle>Aanmelden</CardTitle>
          <CardDescription>Toegang tot het aanbodoverzicht van Coloriginz.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm verder={verder} entraEnabled={entraEnabled} entraError={entraError} />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
