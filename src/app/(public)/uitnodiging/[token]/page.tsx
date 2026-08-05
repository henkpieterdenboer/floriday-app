import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Wachtwoord instellen - Floriday Middleware" };

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  return (
    <AuthShell backgroundImage="/brand/backgrounds/default.jpg" overlay="light">
      {/* Zelfde maatvoering als /login; nagebouwd van het "Activate"-scherm in de preview
          op /auth-pages-starter in het design system. */}
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
          <CardTitle className="text-center text-2xl font-bold">Wachtwoord instellen</CardTitle>
          <CardDescription className="text-center">
            Kies een wachtwoord van minimaal twaalf tekens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm token={token} />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
