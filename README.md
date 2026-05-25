# Apore Marketing Site

Single-page marketing site for Apore — AI-powered adaptive tutoring with a `.edu`-only waitlist.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SHEETS_WEBHOOK_URL` | Yes (prod) | Google Apps Script web app URL |
| `WAITLIST_WEBHOOK_SECRET` | No | Shared secret sent as `X-Waitlist-Secret` |

Without `GOOGLE_SHEETS_WEBHOOK_URL`, the form validates locally but returns a 502 on submit.

## Google Sheet + Apps Script setup

1. Create a Google Sheet with headers in row 1: `timestamp`, `email`, `source`.
2. Open **Extensions → Apps Script** and paste:

```javascript
function doPost(e) {
  const secret = PropertiesService.getScriptProperties().getProperty("WAITLIST_SECRET");
  const body = JSON.parse(e.postData.contents);

  if (secret && body.secret !== secret) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Unauthorized" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  sheet.appendRow([body.timestamp, body.email, body.source]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

3. (Optional) Set script property `WAITLIST_SECRET` to match `WAITLIST_WEBHOOK_SECRET`.
4. Deploy → **New deployment** → type **Web app** → execute as **Me**, access **Anyone**.
5. Copy the deployment URL into `GOOGLE_SHEETS_WEBHOOK_URL`.

## Deploy

Deploy the `site/` directory to Vercel. Set the environment variables in the project settings.

```bash
npm run build
```
