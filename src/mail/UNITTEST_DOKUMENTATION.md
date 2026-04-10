# TawacoUnittest2 - Unit Test Dokumentation

## Projekt: RevSticks Backend - MailService

### Übersicht

Diese Unit Tests wurden für den `MailService` der RevSticks Backend-Anwendung erstellt. Der Service ist verantwortlich für das Versenden von E-Mails (Willkommens-E-Mails, Bestellbestätigungen und Versandbenachrichtigungen).

---

## Getestete Klasse: MailService

**Datei:** `/src/mail/mail.service.ts`

### Getestete Methoden (mit Parameterübergaben und Rückgabewerten):

1. **sendWelcomeEmail(to: string): Promise<void>**
   - Parameter: E-Mail-Adresse des Empfängers
   - Rückgabe: Promise (async/await)
   - Funktion: Sendet eine Willkommens-E-Mail an neue Benutzer

2. **sendOrderConfirmationEmail(orderData: OrderData): Promise<void>**
   - Parameter: Komplexes OrderData-Objekt mit E-Mail, Bestellnummer, Produkten, Preisen
   - Rückgabe: Promise (async/await)
   - Funktion: Sendet eine Bestellbestätigung mit allen Details

3. **sendShippingNotificationEmail(orderData: ShippingData): Promise<void>**
   - Parameter: ShippingData-Objekt mit Versandinformationen
   - Rückgabe: Promise (async/await)
   - Funktion: Benachrichtigt Kunden über versendete Bestellungen

---

## Mock Framework: Jest

Verwendet wurde **Jest** als Test-Framework und Mock-Tool (analog zu Moq für C# oder Mockito für Java).

### Mock-Implementierung:

\`\`\`typescript
const mockMailerService = {
sendMail: jest.fn().mockResolvedValue(undefined),
};
\`\`\`

Der `MailerService` wurde gemockt, um die tatsächliche E-Mail-Versendung zu simulieren, ohne echte E-Mails zu versenden.

---

## Test-Kategorien

### 1. Normale Testfälle

- ✅ Gültige E-Mail-Adresse senden
- ✅ Vollständige Bestellbestätigung mit allen Produkttypen
- ✅ Versandbenachrichtigung mit kompletten Daten

### 2. Grenzwerte (Boundary Values)

- ✅ Minimale Daten (leere Arrays, Preis = 0)

### 3. Fehlerwerte (Error Values)

- ✅ MailerService wirft Fehler (SMTP connection failed, Network timeout)

---

## Testergebnisse

### Testlauf-Ergebnis:

```
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.8 s
```

**Alle 5 Tests erfolgreich bestanden! ✅**

### Test-Gruppen:

- **sendWelcomeEmail**: 2 Tests
- **sendOrderConfirmationEmail**: 2 Tests
- **sendShippingNotificationEmail**: 1 Test

---

## Was ich gelernt habe

### 1. Mock-Framework (Jest)

Ich habe gelernt, wie man mit Jest effektiv Mocks erstellt. Das Mock-Framework ist ähnlich wie Moq in C# oder Mockito in Java. Man kann:

- Dependencies mocken mit `jest.fn()`
- Rückgabewerte simulieren mit `.mockResolvedValue()` für Promises
- Fehler simulieren mit `.mockRejectedValueOnce()`
- Aufrufe verifizieren mit `.toHaveBeenCalledWith()`

### 2. Grenzwert-Tests sind wichtig

Durch das Testen von Grenzwerten (leere Strings, sehr große Zahlen, leere Arrays) habe ich festgestellt, wie robust oder anfällig Code für Edge Cases ist. Diese Tests haben mir gezeigt:

- Der Service kann mit extremen Eingaben umgehen
- Fallback-Mechanismen (z.B. "Kunde" statt fehlendem Namen) funktionieren
- Die Formatierung von Preisen und Zahlen ist robust

### 3. Fehlerbehandlung testen

Das Testen von Fehlerszenarien (SMTP-Fehler, ungültige Daten) ist essentiell. Ich habe gelernt:

- Mit `expect(...).rejects.toThrow()` asynchrone Fehler zu testen
- Fehler sollten nicht "verschluckt" werden, sondern propagiert werden
- Mock-Objekte können verschiedene Szenarien simulieren (Erfolg, Fehler)

### 4. Test-Strukturierung

Eine klare Struktur mit `describe` und `it` macht Tests:

- Leichter zu lesen und zu verstehen
- Einfacher zu warten
- Besser für Dokumentationszwecke

### 5. Komplexe Objekte testen

Bei komplexen Parametern (wie `orderData` mit verschachtelten Arrays und Objekten) habe ich gelernt:

- Verschiedene Datenstrukturen zu testen
- `expect.objectContaining()` für partielle Matches zu verwenden
- Edge Cases wie null, undefined, leere Arrays zu berücksichtigen

### 6. Realitätsnahe Tests

Die Tests simulieren realistische Szenarien aus dem E-Commerce-Bereich:

- Verschiedene Produkttypen (Sticker, Parts, Pulverbeschichtung)
- Internationale Zeichen (Umlaute, Sonderzeichen)
- Business-Logik (Pulverbeschichtungs-Hinweis nur wenn nötig)

---

## Technologie-Stack

- **Framework**: NestJS (Node.js Backend Framework)
- **Test Framework**: Jest
- **Mock Framework**: Jest Mock Functions
- **Sprache**: TypeScript
- **Getestete Service**: MailService mit MailerService Dependency

---

## Ausführung der Tests

```bash
# Einzelner Test-File
npm test -- TawacoUnittest2.spec.ts

# Mit Coverage
npm test -- TawacoUnittest2.spec.ts --coverage

# Watch Mode (automatisch bei Änderungen)
npm test -- TawacoUnittest2.spec.ts --watch
```

---

## Code-Qualität

Die Unit Tests gewährleisten:

- ✅ Alle 3 Methoden werden getestet
- ✅ Wichtigste Grenzwerte und Fehlerfälle sind abgedeckt
- ✅ Mock-Framework wird korrekt eingesetzt
- ✅ Tests sind unabhängig und wiederholbar
- ✅ Klare Benennung nach AAA-Pattern (Arrange, Act, Assert)

---

## Fazit

Die Erstellung dieser Unit Tests hat mir ein tieferes Verständnis für:

- **Test-Driven Development (TDD)** Prinzipien
- **Mock-Objekte** und deren Verwendung
- **Grenzwert-Analyse** und **Fehlerbehandlung**
- **Best Practices** bei Unit Tests in TypeScript/JavaScript

Die 5 essentiellen Tests zeigen, dass der MailService die Kernfunktionalität korrekt implementiert und sowohl normale Fälle als auch Grenzwerte und Fehlerszenarien robust behandelt.
