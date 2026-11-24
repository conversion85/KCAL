# KCAL 2.0 – moderner Kalorien-pro-Portion-Rechner

Statische Website ohne externe JavaScript-Bibliotheken oder Tracking.

## Start

- Direkt lokal: `index.html` im Browser öffnen (Rechner, Verlauf, Taschenrechner funktionieren).
- Für PWA-Installation und Offline-Zugriff nach dem ersten Aufruf: Dateien auf einem HTTPS-Host veröffentlichen oder lokal mit `python -m http.server 8000` starten und `http://localhost:8000/` besuchen.
- Für Netlify: ZIP-Inhalt als Website deployen.

## Funktionen

- Live-Berechnung von Kalorien pro Portion und pro 100 g/ml
- Gewichte und Kalorien mit Dezimalpunkt oder Dezimalkomma
- Schnellwahl von Portionsgrößen
- Verlauf im Browser (max. 30 Berechnungen; bestehender Speicher `calorieHistory` wird weiterverwendet)
- Verlauf löschen, einzelne Einträge entfernen, CSV-Export, Teilen
- Funktionierender Taschenrechner mit Tastaturunterstützung
- Hell-/Dunkelmodus
- Installierbare Progressive Web App und Offline-Cache auf HTTPS

## Datenschutz / Hinweis

Die App übermittelt Eingaben nicht selbst an einen Server. Der Verlauf und die Farbauswahl werden lokal im `localStorage` des Browsers gespeichert; beim Teilen per WhatsApp oder E-Mail werden Daten nur nach aktiver Nutzeraktion an die gewählte Anwendung übergeben. Bei Webhosting fallen unabhängig davon üblicherweise technische Serverzugriffe an. Die Werte sind Rechenhilfen; eine Prüfung der Nährwertangaben findet nicht statt.
