import { assertHexColour, escapeHtml, hrefAttribute } from './email-html'

/* Beheerd bestand van @col/email-shell — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/email-shell --overwrite

   Outlook op Windows negeert border-radius en background-color op een <a>. Zonder
   het VML-blok krijg je daar een gekleurde tekstregel in plaats van een knop.
   De twee varianten sluiten elkaar uit via conditional comments; er is nooit meer
   dan één zichtbaar. Breedte en hoogte in het VML-blok zijn vast — VML kent geen
   auto-breedte, dus een langer label moet je hier controleren. */

export interface EmailButtonOptions {
  href: string
  label: string
  accent: string
  accentContrast: string
}

/** Bouwt de knop-`<table>` voor een e-mail: een VML-variant voor Outlook op
    Windows en een gewone `<a>` voor de rest, mutueel exclusief via conditional
    comments. De breedte in het VML-blok is vast (260px) — een lang label past
    daar niet automatisch in en kan in Outlook afgekapt worden; controleer dat
    handmatig bij een nieuw label. */
export function emailButton({ href, label, accent, accentContrast }: EmailButtonOptions): string {
  const veiligeHref = hrefAttribute(href)
  const veiligLabel = escapeHtml(label)
  const vlak = assertHexColour(accent, 'accent')
  const tekstkleur = assertHexColour(accentContrast, 'accentContrast')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px auto;">
  <tr>
    <td align="center" bgcolor="${vlak}" style="border-radius:6px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${veiligeHref}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="14%" strokecolor="${vlak}" fillcolor="${vlak}">
        <w:anchorlock/>
        <center style="color:${tekstkleur};font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${veiligLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${veiligeHref}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:1.2;color:${tekstkleur};text-decoration:none;border-radius:6px;background-color:${vlak};">${veiligLabel}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`
}
