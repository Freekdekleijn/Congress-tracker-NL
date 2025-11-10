# Congressional Stock Tracker - Data Sync Setup

## Overview

The app includes an edge function that syncs Congressional stock trades from the House Financial Disclosure website. To enable daily updates, you need to set up a scheduled trigger.

## Edge Function

**Function Name:** `sync-congress-trades`
**Endpoint:** `https://your-supabase-url/functions/v1/sync-congress-trades`

## Setting Up Daily Automatic Syncs

### Option 1: Using cron-job.org (Easiest)

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Click "Create cronjob"
4. Configure:
   - **URL:** `https://your-supabase-url/functions/v1/sync-congress-trades`
   - **Request method:** POST
   - **Schedule:** Set two times daily
     - Morning: 6:00 AM (0 6 * * *)
     - Evening: 6:00 PM (0 18 * * *)
5. Save and enable

### Option 2: Using AWS EventBridge (if you use AWS)

1. Create a new EventBridge rule
2. Set up two scheduled expressions:
   - `cron(0 6 * * ? *)` - 6 AM UTC
   - `cron(0 18 * * ? *)` - 6 PM UTC
3. Add target: HTTPS endpoint pointing to your sync function
4. Enable the rules

### Option 3: Using GitHub Actions (Free)

Create `.github/workflows/sync-trades.yml`:

```yaml
name: Sync Congress Trades

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC
    - cron: '0 18 * * *' # 6 PM UTC

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync trades
        run: |
          curl -X POST \
            https://your-supabase-url/functions/v1/sync-congress-trades \
            -H "Content-Type: application/json"
```

## Testing the Sync Function

To test the sync function manually:

```bash
curl -X POST https://your-supabase-url/functions/v1/sync-congress-trades
```

Expected response:
```json
{
  "status": "success",
  "message": "Sync completed",
  "timestamp": "2024-11-09T12:00:00Z",
  "result": {
    "membersAdded": 5,
    "tradesAdded": 25
  }
}
```

## Data Source

The sync function fetches from:
**https://disclosures-clerk.house.gov/FinancialDisclosure**

### Current Implementation Status

- ✅ Edge function deployed
- ✅ Database schema ready
- ✅ Member/trade insert logic implemented
- ⏳ HTML parser for House website (needs development)

### Future Enhancements

To make the scraper work fully, you may need to:

1. **Add an HTML parser** - Use a library like `cheerio` to parse the House website HTML
2. **Implement pagination** - The House website may paginate results
3. **Add error handling** - Handle network timeouts and rate limiting
4. **Cache results** - Avoid redundant requests to the House website

### Manual Data Population (For Testing)

If you want to test with sample data before the full scraper is ready, you can insert test data:

```sql
-- Add a test Congress member
INSERT INTO congress_members (full_name, state, party, chamber)
VALUES ('John Smith', 'CA', 'Republican', 'House');

-- Add a test trade
INSERT INTO trades (member_id, ticker, asset_name, transaction_type, transaction_date, disclosure_date, amount_range, amount_min, amount_max)
SELECT
  id,
  'AAPL',
  'Apple Inc.',
  'purchase',
  '2024-10-15',
  '2024-11-01',
  '$15,001 - $50,000',
  15001,
  50000
FROM congress_members
WHERE full_name = 'John Smith';
```

## Troubleshooting

### Function Returns Empty Results

- The House website structure may have changed
- Try visiting the URL manually to verify it's still accessible
- Check browser console for any error messages

### Rate Limiting

- The House website may rate-limit requests
- Space out sync calls (morning/evening is recommended)
- Add delays between requests in the scraper

### Database Connection Errors

- Verify your Supabase credentials are configured
- Check that the database schema is properly set up
- Review function logs in Supabase dashboard

## Support

For issues with the House disclosure website, contact:
**Email:** clerkweb@mail.house.gov
