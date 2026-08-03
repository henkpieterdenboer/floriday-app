import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Wachtwoord instellen - Floriday middleware" };

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

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
          <CardTitle>Wachtwoord instellen</CardTitle>
          <CardDescription>Kies een wachtwoord van minimaal twaalf tekens.</CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm token={token} />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
