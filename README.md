# Homework Tracker

Track homework and tests for your child. Entries are stored as Google Calendar events.

## Setup

### 1. Google Cloud — enable the Calendar API

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. Enable **Google Calendar API** for the project.
3. Create a **Service Account**: IAM & Admin → Service Accounts → Create.
4. Download a **JSON key** for the service account.

### 2. Share your Google Calendar with the service account

1. Open Google Calendar.
2. Find your calendar, click the three dots → **Settings and sharing**.
3. Under **Share with specific people**, add the service account email (ends with `@<project>.iam.gserviceaccount.com`).
4. Set permission to **Make changes to events**.

### 3. Local development

```bash
cp .env.local.example .env.local
# Edit .env.local — paste your service account JSON and verify CALENDAR_ID
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Railway

1. Push the repo to GitHub.
2. Create a new Railway project from the GitHub repo.
3. In Railway, go to **Variables** and add:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the full JSON key value
   - `CALENDAR_ID` — your calendar ID
   - `TIMEZONE` — e.g. `Europe/Brussels`
4. Railway auto-deploys on push.

## Smoke Test Checklist

Run these manually after deployment to verify everything works end-to-end:

- [ ] Open the app — no error banner, list loads (empty is fine)
- [ ] Add a **homework** item (Math, due tomorrow, no time) → card appears in list
- [ ] Open Google Calendar → event appears with `[HW]` in title and blue color
- [ ] Add a **test** item with a due time → card shows time; event in Google Calendar is a timed block
- [ ] Mark the homework item **done** → card dims, title gets strikethrough; Google Calendar event shows `✓` prefix and gray color
- [ ] Click the **📅** button on a card → opens the event in Google Calendar
- [ ] Click **✕** on an item → confirm dialog → item removed from list and from Google Calendar
- [ ] Change the **Range** filter → list updates
- [ ] Change **Status** to "Done" → only done items show

## Running Tests

```bash
npm test
```
# philippeschoolmonitoring
