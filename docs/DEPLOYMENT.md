# Deployment: Vercel (Aryos Account) + Neon

Die Seite läuft auf **Aryos eigenem Vercel-Konto**, die Datenbank ist **Neon Postgres** (über den Vercel Marketplace, Region Frankfurt). Ausgeliefert wird per **GitHub Actions + Vercel CLI**.

## Warum nicht die normale Git-Integration?

Auf dem kostenlosen Hobby-Plan deployt Vercel Commits aus einem **privaten** Repository nur, wenn der Commit-Autor der Besitzer des Vercel-Kontos ist. Dieses Repository gehört Jerry, die Commits stammen von Jerry bzw. Claude. Git-Deployments auf Aryos Hobby-Konto würden deshalb blockiert ([Vercel-Doku](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#hobby-teams)).

Der Workflow `.github/workflows/deploy.yml` umgeht das sauber: Er deployt bei jedem Push auf `main` mit Aryos **Token** über die Vercel CLI. Zusätzlich prüft `.github/workflows/ci.yml` jeden PR (Lint, Typen, Unit- und E2E-Tests, Build).

## Einmalige Einrichtung (ca. 15 Minuten)

Schritte 1–3 lassen sich sofort erledigen, die Schritte ab 4 nach dem Merge des Setup-PRs.

### 1. Vercel-Konto für Aryo (Aryo)
1. <https://vercel.com/signup> → **Hobby** → mit `aryo.kontakt@gmail.com` (oder GitHub) registrieren.

### 2. Zugriffstoken erzeugen (Aryo)
1. <https://vercel.com/account/settings/tokens> öffnen.
2. **Create Token**: Name `github-deploy-business-aryo`, Scope = Aryos persönlicher Account, Ablauf z. B. 1 Jahr.
3. Token kopieren und nur über einen sicheren Kanal an Jerry geben, nie per Chat oder E-Mail im Klartext. Besser: Aryo trägt ihn selbst bei Schritt 3 ein.

### 3. Token in GitHub hinterlegen (Jerry)
1. Repository → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name `VERCEL_TOKEN`, Wert = Token aus Schritt 2.
3. Optional unter **Variables**: `VERCEL_PROJECT` (Standard `aryo-sabouri`, bestimmt die Adresse `aryo-sabouri.vercel.app`) und `VERCEL_SCOPE`, falls ein Team statt des persönlichen Accounts genutzt wird.

### 4. Vercel-Projekt anlegen (Jerry, nach dem Merge)
1. GitHub → **Actions → Deploy to Vercel → Run workflow** → Modus **`create-project`**.
2. Der Lauf legt das Projekt `aryo-sabouri` in Aryos Konto an.

### 5. Neon-Datenbank verbinden (Aryo)
1. Vercel Dashboard → Projekt **aryo-sabouri → Storage → Create Database → Neon (Serverless Postgres)**.
2. Region **Frankfurt (eu-central-1)**, Plan **Free**, Name z. B. `aryo-sabouri-db`.
3. **Connect** zum Projekt für **Production** (und optional Preview). Vercel setzt dabei automatisch `DATABASE_URL`, `DATABASE_URL_UNPOOLED` usw.

### 6. Umgebungsvariablen setzen (Aryo oder Jerry)
Vercel → Projekt → **Settings → Environment Variables** (Environment: Production):

| Name | Wert |
|---|---|
| `BETTER_AUTH_SECRET` | Zufallswert, z. B. `openssl rand -base64 32` |
| `ADMIN_SETUP_TOKEN` | Einmal-Code für die Ersteinrichtung, z. B. `openssl rand -hex 16` |
| `ADMIN_EMAILS` | optional, Standard `aryo.kontakt@gmail.com` (kommagetrennt) |
| `NEXT_PUBLIC_SITE_URL` | nur bei eigener Domain, z. B. `https://www.beispiel.de` |

`BETTER_AUTH_URL` ist nicht nötig, die Adresse wird aus den Vercel-Systemvariablen abgeleitet.

### 7. Deployen
1. **Actions → Deploy to Vercel → Run workflow → `deploy`**. Alternativ deployt jeder Push auf `main` automatisch.
2. Der Build führt vorher die Datenbank-Migrationen aus (`npm run vercel-build`).

### 8. Admin-Konto einrichten (Aryo)
1. `https://aryo-sabouri.vercel.app/einrichten` öffnen.
2. Passwort wählen, `ADMIN_SETUP_TOKEN` als Einrichtungscode eingeben.
3. Danach schließt sich `/einrichten` automatisch. Den `ADMIN_SETUP_TOKEN` kann man anschließend löschen.
4. Weitere Personen legt Aryo im Studio unter **Nutzer** an.

## Eigene Domain (optional)
Vercel → Projekt → **Settings → Domains** → Domain hinzufügen, DNS-Einträge beim Registrar setzen, danach `NEXT_PUBLIC_SITE_URL` auf die Domain setzen und neu deployen.

## Geführt durch das devops-Plugin
Lokal (Claude Code mit dem `devops`-Plugin und Edge) kann der Skill **auto-guide** die Dashboard-Schritte 1, 2, 5 und 6 live im Browser begleiten, z. B. mit „führe mich durch das Vercel-Setup“. In Cloud-Sessions steht der Browser-Guide nicht zur Verfügung, dort gilt diese Anleitung.

## Fehlersuche

| Symptom | Ursache / Lösung |
|---|---|
| Deploy-Workflow: „Deploy skipped“ | Secret `VERCEL_TOKEN` fehlt (Schritt 3). |
| Build: `DATABASE_URL is missing` | Neon ist nicht mit dem Projekt verbunden (Schritt 5). |
| `/einrichten`: „Die Einrichtung ist nicht freigeschaltet“ | `ADMIN_SETUP_TOKEN` fehlt, danach neu deployen. |
| Login schlägt mit 403 fehl | Aufruf über eine unbekannte Domain: `NEXT_PUBLIC_SITE_URL` bzw. Domain in Vercel prüfen. |
