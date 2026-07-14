# FFW Tool — Termin-Erfassungsmaske FFW Brittheim

Dieses Repository enthält das **Termin-Erfassungsmaske & Management Cockpit** für die Termine der **Freiwilligen Feuerwehr Brittheim**. Es dient zur Erfassung, Verwaltung, Visualisierung und Verteilung von Dienst- und Übungsterminen.

Das Tool läuft als moderne Single-Page-Web-App (PWA) und synchronisiert sich automatisiert mit einem externen Google Kalender.

---

## 🚀 Features

* 📅 **Terminverwaltung:** Übersichtliche tabellarische Auflistung aller Termine mit Filterung nach Gruppe und schnellem Hinzufügen/Löschen von Einträgen.
* 👥 **Mannschaftsverwaltung:** Zuweisung von Gruppen (z. B. "Zug", "Hosi", "Alle").
* 📆 **iCal/ICS-Export:** Einzelne oder alle Termine können direkt als standardisierte `.ics`-Kalenderdateien heruntergeladen werden, um sie in Outlook, Apple Calendar oder Google Calendar zu importieren.
* 🔄 **Google Calendar Synchronisation:** Ein automatisiertes Headless-Synchronisationsskript gleicht tägliche Einträge aus dem Google Kalender ab und führt sie mit lokalen Terminen zusammen.
* 📱 **PWA-Support:** Vollständig mobiloptimiert und offlinefähig.

---

## 🛠️ Tech Stack

* **Frontend Framework:** [Vue 3](https://vuejs.org/) (Composition API mit `<script setup>`)
* **Build-Tool:** [Vite](https://vitejs.dev/)
* **UI-Komponenten:** [PrimeVue v4](https://primevue.org/) & PrimeIcons
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Testen:** [Vitest](https://vitest.dev/)
* **Kalender-Integration:** `cal-parser`, `ics`

---

## 💻 Lokale Entwicklung

Stelle sicher, dass du **Node.js (v24 oder höher)** installiert hast.

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```
Der Server startet standardmäßig unter `http://localhost:5173`.

### 3. Produktions-Build erstellen
Baut die App und generiert automatisch das iCal-Archiv:
```bash
npm run build
```

### 4. Tests ausführen
Führt die Vitest-Unit-Tests aus:
```bash
npm run test
```

### 5. GCal-Synchronisation manuell starten
Gleicht lokale Termine in `public/termine.json` mit dem Google Kalender ab:
```bash
npm run sync-gcal
```

---

## 🤖 CI/CD & Automatisierung (GitHub Actions)

Das Projekt nutzt zwei automatisierte GitHub-Workflows:

1. **Deploy to GitHub Pages (`deploy.yml`):**
   Wird bei jedem Push auf den `main`-Branch ausgelöst. Baut das Projekt und veröffentlicht die statische App auf GitHub Pages.
2. **GCal Sync (`gcal-sync.yml`):**
   Wird täglich um 04:00 UTC per Cron-Job ausgeführt. Synchronisiert die neuesten Kalenderdaten, aktualisiert `public/termine.json` und schiebt die Änderungen auf den Branch `chore/calendar` (ohne den `main`-Code-Branch direkt zu belasten).