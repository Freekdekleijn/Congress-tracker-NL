# Automatische Data Sync - 3x per dag

De app synchroniseert Congress trading data automatisch 3 keer per dag via een externe cron service.

## Setup Instructies (cron-job.org)

### Stap 1: Account aanmaken
1. Ga naar https://cron-job.org
2. Klik op **Sign up** (gratis account)
3. Bevestig je email

### Stap 2: Cronjob aanmaken
1. Log in en klik op **Create cronjob**
2. Vul de volgende gegevens in:

**Basic settings:**
- **Title:** `Congress Tracker Sync`
- **Address (URL):** `https://zktriawagxkljcgfjgwi.supabase.co/functions/v1/sync-congress-trades`

**Schedule:**
- Kies **Every 8 hours** (3x per dag)
- Of stel handmatig in: `0 */8 * * *` (draait om 00:00, 08:00, 16:00)

**Request settings:**
- **Request method:** `POST`
- **Request timeout:** `30 seconds`

**Headers:**
Voeg deze header toe:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdHJpYXdhZ3hrbGpjZ2ZqZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTI1NjksImV4cCI6MjA3ODE2ODU2OX0.zx5xJ73bY_KH-C8ExYEyF_6su6N9bFFdUxsrFCF47L8
```

3. Klik op **Create cronjob**

### Stap 3: Testen
1. Klik op **▶️ Run now** om de sync direct te testen
2. Check de **Execution history** voor resultaten

## Alternatieve Services

Als cron-job.org niet werkt, kun je ook gebruik maken van:

### EasyCron (https://www.easycron.com)
- Gratis plan beschikbaar
- Zelfde configuratie als hierboven

### GitHub Actions (gratis)
Maak `.github/workflows/sync.yml`:
```yaml
name: Sync Congress Data
on:
  schedule:
    - cron: '0 */8 * * *'  # Elke 8 uur
  workflow_dispatch:  # Handmatig uitvoeren

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://zktriawagxkljcgfjgwi.supabase.co/functions/v1/sync-congress-trades
```

## Verificatie

Na setup kun je controleren of de sync werkt:
1. Check de execution logs in cron-job.org
2. Of check direct in Supabase:
   - Ga naar https://supabase.com/dashboard
   - Open je project → Edge Functions
   - Klik op `sync-congress-trades` → Logs tab

## Sync Schema

De data wordt automatisch gesynchroniseerd op:
- **00:00** (middernacht)
- **08:00** (ochtend)
- **16:00** (middag)

Dit zorgt ervoor dat gebruikers altijd toegang hebben tot de meest recente congressional trading data!

## Data Bronnen

De sync functie haalt data op van GovTrack.us voor Congress Members.

Voor trading data heb je een API key nodig van een van deze services:
1. **Financial Modeling Prep** - https://site.financialmodelingprep.com
2. **Finnhub** - https://finnhub.io
3. **House Stock Watcher** - https://housestockwatcher.com

Implementatie instructies staan in `/supabase/functions/sync-congress-trades/index.ts`
