import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandLogo } from "@/components/brand/brand-logo";
import { entraEnabled } from "@/features/auth/auth-config";
import { entraErrorMessage } from "@/features/auth/entra-error-messages";
import { isSafeRedirectPath } from "@/features/auth/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata = { title: "Aanmelden - Floriday Middleware" };

interface LoginPageProps {
  searchParams: Promise<{ fout?: string; verder?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const verder = params.verder && isSafeRedirectPath(params.verder) ? params.verder : "";
  const entraError = entraErrorMessage(params.fout);

  return (
    <AuthShell backgroundImage="/brand/backgrounds/default.jpg" overlay="light">
      {/* Maatvoering nagebouwd van de preview op /auth-pages-starter in het design system;
          zie docs/design-system.md voor waarom de klassen hier expliciet staan. */}
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-2 space-y-4">
          <div className="flex justify-center">
            <BrandLogo
              src="/brand/logos/coloriginz.png"
              alt="Coloriginz"
              variant="plain"
              size="h-12"
            />
          </div>
          <CardTitle className="text-center text-2xl font-bold">Floriday Middleware</CardTitle>
          <CardDescription className="text-center">
            Toegang tot het aanbod van Floriday.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm verder={verder} entraEnabled={entraEnabled} entraError={entraError} />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
