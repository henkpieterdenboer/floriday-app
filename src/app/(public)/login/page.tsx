import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Aanmelden</CardTitle>
          <CardDescription>Toegang tot het aanbodoverzicht van Coloriginz.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm verder={verder} entraEnabled={entraEnabled} entraError={entraError} />
        </CardContent>
      </Card>
    </main>
  );
}
