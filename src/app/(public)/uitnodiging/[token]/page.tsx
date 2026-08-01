import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Wachtwoord instellen - Floriday middleware" };

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Wachtwoord instellen</CardTitle>
          <CardDescription>Kies een wachtwoord van minimaal twaalf tekens.</CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
