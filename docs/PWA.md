# Website als App (PWA)

Die öffentliche Website lässt sich auf Android, iPhone/iPad, Windows, macOS und Linux als App installieren. Sie öffnet sich dann im eigenen Fenster ohne Browserleiste und mit dem Logo als App-Symbol.

## Wie installiert wird

| Plattform / Browser | Weg |
|---|---|
| Android, Windows, macOS, Linux mit Chrome, Edge, Samsung Internet | **Direkt:** Der Button öffnet den Installationsdialog des Browsers (`beforeinstallprompt`). |
| iPhone & iPad (alle Browser) | Anleitung: Teilen → „Zum Home-Bildschirm“ |
| Mac mit Safari 17+ | Anleitung: Ablage → „Zum Dock hinzufügen“ |
| Android mit Firefox | Anleitung: Menü → „Installieren“ |
| Firefox am Desktop | keine Web-Apps → nichts wird angeboten |

Bietet ein Chromium-Browser keinen Dialog an, ist die App meist schon installiert. Button und Hinweis bleiben dort deshalb ausgeblendet. Läuft die Seite bereits als App, verschwindet beides ebenfalls.

## Wo die Installation angeboten wird

- **Footer:** „App installieren“, neben Impressum und Datenschutz.
- **Mini-Aryo:** Etwa alle zwei Wochen hat der Chat-Button eine neue Nachricht. Sie kommt nie sofort, sondern erst, wenn der Besucher mit der Seite interagiert hat (Scrollen, Klicken, Tippen) und danach **3 Sekunden** nichts davon getan hat. Solange ein Eingabefeld fokussiert oder der Tab im Hintergrund ist, wartet sie weiter. Dann wackelt der Button, zeigt ein Badge „1“ und eine kurze Sprechblase. Im Chat steht die Nachricht mit „Jetzt installieren“ bzw. der passenden Anleitung. Der Zeitpunkt liegt in `localStorage` (`aryo:app-hint-shown-at`).

## Dateien

| Datei | Zweck |
|---|---|
| `src/app/manifest.ts` | Web-App-Manifest (Name, Farben, Icons, Shortcuts) |
| `src/app/app-icons/[file]/route.tsx`, `src/app/apple-icon.tsx` | PNG-Icons aus dem Logo (`any`, `maskable`, Apple), beim Build erzeugt |
| `public/sw.js`, `public/offline.html` | Service Worker: Seiten kommen immer aus dem Netz, nur offline erscheint die Offline-Seite |
| `src/features/pwa/` | Plattformerkennung und Anleitungen, Install-Status, Zwei-Wochen-Intervall, Leerlauferkennung, UI |
| `src/features/berater/ui/BeraterFab.tsx` | Nachricht, Badge und Animation von Mini-Aryo |

Die Texte der Anleitungen stehen in `INSTALL_GUIDES` (`src/features/pwa/platform.ts`), das Intervall in `NUDGE_INTERVAL_MS` (`src/features/pwa/nudge.ts`).

## Testen

- Chrome/Edge: DevTools → Application → Manifest zeigt Installierbarkeit und Icons. Hinweis erneut auslösen: `localStorage.removeItem("aryo:app-hint-shown-at")` und neu laden.
- Der Service Worker wird nur im Production-Build registriert (`npm run build && npm start`).
- Nach Änderungen an `public/sw.js` die Cache-Version (`CACHE`) erhöhen.
