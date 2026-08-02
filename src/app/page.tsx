import { redirect } from "next/navigation";

/**
 * De hoofdpagina bestaat niet als zelfstandig scherm; de applicatie is het aanbodoverzicht.
 *
 * Doorsturen naar /aanbod in plaats van naar /login, want de middleware beschermt dat pad
 * al: wie niet is aangemeld belandt vanzelf op /login?verder=/aanbod en komt na aanmelden
 * meteen op de goede plek uit. Rechtstreeks naar /login sturen zou die terugweg weggooien.
 */
export default function Home() {
  redirect("/aanbod");
}
