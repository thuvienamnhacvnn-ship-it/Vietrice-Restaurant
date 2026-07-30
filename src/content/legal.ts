import { site } from '@/config/site'
import type { LegalBlock } from '@/components/layout/LegalPage'

/**
 * Statutory and policy copy.
 *
 * IMPORTANT — this is a working draft, not legal advice. The placeholders below
 * marked [ … ] are details only the operator holds (company form, register
 * number, VAT ID, managing director, DPO). German law (§5 TMG) requires them to
 * be accurate and complete; an Impressum with invented details is worse than
 * none, so they are left visibly blank rather than filled with plausible
 * fiction. Have a lawyer review before going live.
 */
const TODO = '[bitte ergänzen]'

export const impressum: LegalBlock[] = [
  {
    heading: 'Angaben gemäß § 5 TMG',
    body: [
      `${site.legalName}\n${site.address.street}\n${site.address.postalCode} ${site.address.city}\n${site.address.country}`,
    ],
  },
  {
    heading: 'Vertreten durch',
    body: [`Geschäftsführer: ${TODO}`],
  },
  {
    heading: 'Kontakt',
    body: [`Telefon: ${site.phone.display}\nE-Mail: ${site.email}\nWeb: ${site.domain}`],
  },
  {
    heading: 'Registereintrag',
    body: [`Registergericht: ${TODO}\nRegisternummer: ${TODO}`],
  },
  {
    heading: 'Umsatzsteuer-ID',
    body: [`Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${TODO}`],
  },
  {
    heading: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
    body: [
      `${TODO}\n${site.address.street}\n${site.address.postalCode} ${site.address.city}`,
    ],
  },
  {
    heading: 'EU-Streitschlichtung',
    body: [
      'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr',
      'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    ],
  },
]

export const datenschutz: LegalBlock[] = [
  {
    heading: 'Verantwortlicher',
    body: [
      `Verantwortlich für die Datenverarbeitung auf dieser Website ist:\n${site.legalName}\n${site.address.street}\n${site.address.postalCode} ${site.address.city}\nE-Mail: ${site.email}`,
    ],
  },
  {
    heading: 'Tischreservierung',
    body: [
      'Bei einer Reservierung verarbeiten wir Name, Telefonnummer und — sofern angegeben — E-Mail-Adresse, Personenzahl, Datum, Uhrzeit sowie Ihre freiwilligen Angaben zu Anlass, Allergien und Sonderwünschen.',
      'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme). Angaben zu Allergien sind Gesundheitsdaten im Sinne von Art. 9 DSGVO; wir verarbeiten sie ausschließlich auf Grundlage Ihrer freiwilligen Einwilligung und nur, um Ihre Mahlzeit sicher zuzubereiten.',
      'Reservierungsdaten werden nach Ablauf handels- und steuerrechtlicher Aufbewahrungsfristen gelöscht.',
    ],
  },
  {
    heading: 'Newsletter',
    body: [
      'Der Newsletter wird nur mit Ihrer ausdrücklichen Einwilligung versendet (Art. 6 Abs. 1 lit. a DSGVO). Wir speichern den Zeitpunkt der Einwilligung, um sie nachweisen zu können.',
      'Sie können sich jederzeit über den Abmeldelink in jeder E-Mail abmelden. Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung.',
    ],
  },
  {
    heading: 'AI Chef Assistant',
    body: [
      'Der Assistent beantwortet Fragen auf Basis unserer Speisekarte und aktuellen Angebote. Ihre Eingaben werden zur Beantwortung verarbeitet.',
      'Bitte geben Sie im Chat keine sensiblen personenbezogenen Daten ein.',
    ],
  },
  {
    heading: 'Google Maps',
    body: [
      'Wir binden eine Karte von Google ein, damit Sie uns finden. Beim Laden der Karte stellt Ihr Browser eine Verbindung zu Google her und übermittelt dabei Ihre IP-Adresse.',
      'Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.',
    ],
  },
  {
    heading: 'Ihre Rechte',
    body: [
      'Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21 DSGVO).',
      `Wenden Sie sich dazu an ${site.email}. Ihnen steht zudem ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.`,
    ],
  },
]

export const agb: LegalBlock[] = [
  {
    heading: 'Geltungsbereich',
    body: [
      `Diese Nutzungsbedingungen gelten für die Website ${site.domain} sowie für Tischreservierungen und Abholbestellungen, die darüber vorgenommen werden.`,
    ],
  },
  {
    heading: 'Reservierungen',
    body: [
      'Eine über die Website abgesendete Reservierung ist eine Anfrage. Sie wird erst verbindlich, wenn wir sie telefonisch oder per E-Mail bestätigen.',
      'Bitte erscheinen Sie pünktlich. Reservierte Tische halten wir 15 Minuten über die vereinbarte Zeit hinaus frei.',
    ],
  },
  {
    heading: 'Abholbestellungen',
    body: [
      'Bestellungen zur Abholung werden im Restaurant bezahlt. Eine Online-Zahlung findet derzeit nicht statt.',
      'Maßgeblich sind die zum Zeitpunkt der Bestellung auf der Website ausgewiesenen Preise.',
    ],
  },
]

export const stornierung: LegalBlock[] = [
  {
    heading: 'Stornierung von Reservierungen',
    body: [
      'Sie können Ihre Reservierung bis 4 Stunden vor der vereinbarten Zeit kostenfrei stornieren.',
      `Rufen Sie uns dazu unter ${site.phone.display} an oder schreiben Sie an ${site.email} und nennen Sie Ihren Reservierungscode.`,
    ],
  },
  {
    heading: 'Nichterscheinen',
    body: [
      'Erscheinen Sie ohne Absage nicht, halten wir den Tisch 15 Minuten frei und vergeben ihn danach weiter.',
    ],
  },
  {
    heading: 'Gruppen und Veranstaltungen',
    body: [
      'Für Gruppen ab 8 Personen und private Veranstaltungen gelten gesonderte Absprachen. Bitte kontaktieren Sie uns direkt.',
    ],
  },
]

export const allergene: LegalBlock[] = [
  {
    heading: 'Kennzeichnung',
    body: [
      'Die 14 kennzeichnungspflichtigen Allergene gemäß EU-Verordnung Nr. 1169/2011 sind bei jedem Gericht in unserem Menü mit Buchstabencodes ausgewiesen.',
    ],
  },
  {
    heading: 'Wichtiger Hinweis',
    body: [
      'Unsere Gerichte werden in einer Küche zubereitet, in der sämtliche Allergene verarbeitet werden. Spuren lassen sich daher trotz sorgfältigen Arbeitens nicht vollständig ausschließen.',
      `Bei einer Allergie sprechen Sie uns bitte vor der Bestellung an — telefonisch unter ${site.phone.display} oder direkt beim Servicepersonal. Wir beraten Sie gerne persönlich.`,
    ],
  },
]

export const faq: LegalBlock[] = [
  {
    heading: 'Muss ich reservieren?',
    body: [
      'Eine Reservierung ist nicht zwingend, wird aber besonders am Wochenende empfohlen. Sie können online oder telefonisch reservieren.',
    ],
  },
  {
    heading: 'Wann ist meine Reservierung bestätigt?',
    body: [
      'Nach dem Absenden erhalten Sie einen Reservierungscode. Wir rufen Sie anschließend zur Bestätigung an.',
    ],
  },
  {
    heading: 'Bieten Sie vegetarische und vegane Gerichte an?',
    body: [
      'Ja. Im Menü finden Sie eine eigene Kategorie „Vegetarisch". Der AI Chef Assistant filtert Gerichte auch nach Allergien und Schärfegrad.',
    ],
  },
  {
    heading: 'Kann ich zum Mitnehmen bestellen?',
    body: [
      'Ja, über „Online bestellen". Die Bezahlung erfolgt derzeit bei Abholung im Restaurant.',
    ],
  },
  {
    heading: 'Gibt es Parkplätze?',
    body: ['Ja, in unmittelbarer Umgebung stehen Parkplätze zur Verfügung.'],
  },
]

/**
 * Cookie policy.
 *
 * This list is written from the code, not from a template: `vr_locale`
 * (i18n/config.ts), `vr_admin` (lib/auth.ts) and `vr_cart` (store/cart.ts) are
 * every client-side store the app creates. No analytics, advertising or
 * third-party tracking cookies are set — which is why the site shows no consent
 * banner. If a tracker is ever added, consent under § 25 TDDDG becomes
 * mandatory and this section must be updated first.
 */
export const cookies: LegalBlock[] = [
  {
    heading: 'Überblick',
    body: [
      'Diese Website verwendet ausschließlich technisch notwendige Cookies sowie lokalen Browser-Speicher für den Warenkorb. Wir setzen keine Analyse-, Werbe- oder Tracking-Cookies und geben keine Daten an Werbenetzwerke weiter.',
      'Da keine einwilligungspflichtigen Cookies zum Einsatz kommen, benötigen wir nach § 25 Abs. 2 TDDDG keine Cookie-Einwilligung und zeigen daher kein Consent-Banner.',
    ],
  },
  {
    heading: 'Technisch notwendige Cookies',
    body: [
      'vr_locale — speichert Ihre Sprachauswahl (Deutsch, Englisch, Vietnamesisch). Laufzeit: 12 Monate. Enthält ausschließlich das Sprachkürzel.',
      'vr_admin — Anmeldesitzung des Restaurant-Teams im Verwaltungsbereich. Wird nur nach einer Anmeldung gesetzt, ist HttpOnly und wird beim Abmelden gelöscht. Für Gäste der Website wird dieses Cookie nie gesetzt.',
    ],
  },
  {
    heading: 'Lokaler Browser-Speicher',
    body: [
      'vr_cart — Ihr Warenkorb für Abholbestellungen wird im Local Storage Ihres Browsers gespeichert, damit er beim Seitenwechsel erhalten bleibt. Er enthält nur Gerichtskennungen, Mengen und Ihre Anmerkungen — keine Namen, Telefonnummern oder Zahlungsdaten. Diese Daten verlassen Ihren Browser erst mit dem Absenden der Bestellung.',
    ],
  },
  {
    heading: 'Eingebettete Karte',
    body: [
      'Auf der Kontaktseite und im Footer binden wir eine Google-Maps-Karte ein. Die Karte wird erst geladen, wenn Sie sie aktiv öffnen; dabei stellt Ihr Browser eine Verbindung zu Google her und übermittelt Ihre IP-Adresse. Einzelheiten finden Sie in unserer Datenschutzerklärung.',
    ],
  },
  {
    heading: 'Cookies löschen',
    body: [
      'Sie können gesetzte Cookies und den lokalen Speicher jederzeit in den Einstellungen Ihres Browsers löschen oder blockieren. Wird vr_locale blockiert, erscheint die Website in der Standardsprache Deutsch; wird der lokale Speicher blockiert, geht der Warenkorb beim Seitenwechsel verloren.',
    ],
  },
]
