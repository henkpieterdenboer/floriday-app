import { redirect } from "next/navigation";

/**
 * De hoofdpagina bestaat niet als zelfstandig scherm.
 *
 * Doorsturen naar /status en niet naar /aanbod: dit is middleware, en het eerste wat je
 * wilt weten is of de koppeling met Floriday werkt. Pas als die groen staat zegt het
 * aanbodscherm iets. Omdraaien is één regel, mocht blijken dat inkopers liever meteen op
 * het aanbod uitkomen.
 *
 * Doorsturen naar een beschermd pad in plaats van naar /login, want de middleware beschermt
 * dat al: wie niet is aangemeld belandt vanzelf op /login?verder=/status en komt na
 * aanmelden meteen op de goede plek uit. Rechtstreeks naar /login sturen zou die terugweg
 * weggooien.
 */
export default function Home() {
  redirect("/status");
}
