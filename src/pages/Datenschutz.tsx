import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Startseite", "item": "https://biblebot.life/" },
    { "@type": "ListItem", "position": 2, "name": "Datenschutz", "item": "https://biblebot.life/datenschutz" }
  ]
};

const Datenschutz = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(breadcrumbJsonLd);
    script.id = "breadcrumb-jsonld";
    document.head.appendChild(script);
    return () => { document.getElementById("breadcrumb-jsonld")?.remove(); };
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Verantwortliche Stelle</h2>
            <p className="text-muted-foreground">
              Reto Wettstein<br />
              Rebmoosweg 63<br />
              5200 Brugg<br />
              Schweiz<br /><br />
              E-Mail: <a href="mailto:kontakt@biblebot.life" className="text-primary hover:underline">kontakt@biblebot.life</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Allgemeine Hinweise</h2>
            <p className="text-muted-foreground">
              Diese Datenschutzerklärung informiert Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf der Website biblebot.life. Sie gilt für alle Unterseiten und Dienste dieser Website. Massgeblich ist das Schweizer Bundesgesetz über den Datenschutz (DSG) sowie, soweit anwendbar, die EU-Datenschutz-Grundverordnung (DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Erhobene Daten</h2>
            <p className="text-muted-foreground">
              <strong>Ohne Registrierung:</strong> BibleBot.Life kann vollständig anonym und ohne Login genutzt werden. Bei der normalen Nutzung werden keine personenbezogenen Daten gespeichert. Chat-Verläufe werden ausschliesslich lokal im Browser gespeichert und nicht auf unseren Servern.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Mit Registrierung:</strong> Wenn Sie sich freiwillig registrieren (z.&nbsp;B. für den persönlichen Bereich oder den Messeplaner), wird Ihre E-Mail-Adresse gespeichert. Diese dient ausschliesslich der Authentifizierung und Kontoverwaltung.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Täglicher Impuls (Abo):</strong> Wenn Sie den täglichen Impuls abonnieren, wird je nach gewähltem Kanal Ihre Telegram-Chat-ID, Push-Subscription oder Telefonnummer gespeichert.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Gebetsanliegen:</strong> Gebetsanliegen werden mit einer anonymen Session-ID gespeichert. Sie können optional einen Namen angeben, dieser wird nur angezeigt, wenn Sie dies ausdrücklich wünschen.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Server-Logdaten:</strong> Beim Besuch der Website werden technische Daten wie IP-Adresse, Browsertyp, Betriebssystem und Zugriffszeitpunkt kurzzeitig in Server-Logs erfasst. Diese Daten dienen ausschliesslich der technischen Sicherstellung des Betriebs und werden nicht mit Personen verknüpft.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Zweck der Datenverarbeitung</h2>
            <p className="text-muted-foreground">
              Die erhobenen Daten werden ausschliesslich für folgende Zwecke verwendet:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 mt-2 space-y-1">
              <li>Bereitstellung und Betrieb der Website und ihrer Funktionen</li>
              <li>Authentifizierung registrierter Nutzerinnen und Nutzer</li>
              <li>Zustellung des täglichen Impulses über den gewählten Kanal</li>
              <li>Anzeige moderierter Gebetsanliegen auf der Gebetswand</li>
              <li>Technische Sicherheit und Missbrauchsprävention</li>
              <li>Anonymisierte Nutzungsstatistiken zur Verbesserung des Angebots</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. KI-Verarbeitung</h2>
            <p className="text-muted-foreground">
              BibleBot.Life verwendet KI-Modelle (via Lovable AI Gateway) zur Beantwortung von Fragen und zur Erstellung von Impulsen. Ihre Chat-Nachrichten werden an den KI-Dienst übermittelt, dort verarbeitet und nicht dauerhaft gespeichert. Es findet kein Training von KI-Modellen mit Ihren Daten statt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Weitergabe an Dritte</h2>
            <p className="text-muted-foreground">
              Personenbezogene Daten werden grundsätzlich nicht an Dritte verkauft oder zu Werbezwecken weitergegeben. Folgende Dienste werden zur Bereitstellung der Website eingesetzt:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 mt-2 space-y-1">
              <li><strong>Lovable Cloud (Supabase):</strong> Hosting, Datenbank und Authentifizierung (Server in der EU/USA)</li>
              <li><strong>Lovable AI Gateway:</strong> KI-Verarbeitung für Chat und Impulse</li>
              <li><strong>ElevenLabs:</strong> Sprachausgabe (Text-to-Speech) und Spracheingabe (Speech-to-Text)</li>
              <li><strong>Resend:</strong> Versand von Transaktions-E-Mails (Bestätigungen, Passwort-Reset)</li>
              <li><strong>Telegram Bot API:</strong> Zustellung des täglichen Impulses an Telegram-Abonnenten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              BibleBot.Life verwendet <strong>keine Tracking-Cookies</strong> und <strong>kein Google Analytics</strong>. Es werden lediglich technisch notwendige Daten im lokalen Speicher (localStorage) des Browsers abgelegt, z.&nbsp;B. für Spracheinstellungen, Dark-Mode-Präferenz und den lokalen Chat-Verlauf. Diese Daten verlassen Ihren Browser nicht.
            </p>
            <p className="text-muted-foreground mt-2">
              Für die anonymisierte Nutzungsstatistik verwenden wir ein eigenes, datenschutzfreundliches Analytics-System ohne Cookies und ohne personenbezogene Zuordnung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Ihre Rechte</h2>
            <p className="text-muted-foreground">
              Sie haben gemäss dem Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, der DSGVO folgende Rechte:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 mt-2 space-y-1">
              <li><strong>Auskunft:</strong> Sie können jederzeit Auskunft über die zu Ihrer Person gespeicherten Daten verlangen.</li>
              <li><strong>Berichtigung:</strong> Sie können die Berichtigung unrichtiger Daten verlangen.</li>
              <li><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzliche Aufbewahrungspflicht besteht.</li>
              <li><strong>Widerruf:</strong> Eine erteilte Einwilligung können Sie jederzeit widerrufen.</li>
              <li><strong>Beschwerde:</strong> Sie haben das Recht, beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) eine Beschwerde einzureichen.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href="mailto:kontakt@biblebot.life" className="text-primary hover:underline">kontakt@biblebot.life</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Datensicherheit</h2>
            <p className="text-muted-foreground">
              Wir treffen angemessene technische und organisatorische Massnahmen, um Ihre Daten vor unbefugtem Zugriff, Verlust oder Missbrauch zu schützen. Die Datenübertragung erfolgt verschlüsselt über HTTPS. Der Zugriff auf die Datenbank ist durch Row-Level-Security-Richtlinien geschützt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Änderungen</h2>
            <p className="text-muted-foreground">
              Diese Datenschutzerklärung kann jederzeit angepasst werden. Die aktuelle Version ist stets auf dieser Seite abrufbar.<br /><br />
              Stand: April 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
