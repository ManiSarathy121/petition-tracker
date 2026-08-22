# மனு கண்காணிப்பு அமைப்பு · Petition Tracking System

A digitised version of the manual petition register (**C.F. 301**) — receive petitions
at the counter, forward them to the responsible department and officer, and track
them through to closure with comments and attachments.

Bilingual interface (தமிழ் / English) with a toggle in the header.

---

## What's already live

The **Supabase backend is fully provisioned and running**. Nothing needs to be set up
there — schema, row level security, storage bucket, seed data and the admin account
all exist.

| | |
|---|---|
| Supabase project | `ollhtyeflpggdazrsqsq` (ap-northeast-2) |
| API URL | `https://ollhtyeflpggdazrsqsq.supabase.co` |
| Storage bucket | `petition-files` (private, 15 MB/file, PDF + images) |
| Seeded | 38 Tamil Nadu districts, 15 departments (all bilingual) |

**Sign in with:**

```
admin@petition.tn  /  TnAdmin@2026
```

> Change this password on first login (Administration → Users → Reset password).

---

## Deploying the front end

The app builds clean (`npm run build`). Pick either route:

### Option A — Vercel CLI (fastest)

```bash
unzip petition-tracker.zip
cd petition-tracker
npm install
npx vercel --prod
```

Accept the defaults; Vercel detects Next.js. A project named `petition-tracker-tn`
already exists in the **hydra-specma** team — link to it when prompted, or let the
CLI create a new one.

### Option B — GitHub → Vercel

```bash
cd petition-tracker
git init && git add -A && git commit -m "Petition tracking system"
gh repo create petition-tracker --private --source=. --push
```

Then in Vercel: **Add New → Project → Import** the repo. No settings to change.

### Environment variables

None are required — the Supabase URL and the publishable key are compiled in as
defaults (`src/lib/supabase/config.ts`). The publishable key is safe in the browser;
every table is guarded by row level security.

To point the app at a different Supabase project, set:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## How the register maps to the app

| C.F. 301 column | Field |
|---|---|
| 1 · வரிசை எண் | `serial_no` — auto-numbered per year |
| 2 · நடபடி எண் | `proceedings_no` |
| 3 · எழுத்தர் பெற்ற நாள் | `received_date` |
| 4.1 · தலைப்பு | `subject` |
| 4.2 · எழுதியவர் பெயர் | `writer_name` |
| 4.3 · வெளி எண் / நாள் | `outward_no`, `outward_date` |
| 5 · நடவடிக்கை எடுத்த நாள் | `action_taken_date` — stamped on first status update |
| 6 · அடுத்த நடவடிக்கை எடுக்கும் நாள் | `next_action_date` |
| 7 · பதிவின் தன்மை | `register_remarks` |

Every petition also gets a system reference: `PET/<year>/<6-digit serial>`.

---

## Roles

**Administrator** — everything:

- Register new petitions, edit any field, assign department + officer, set priority
- Manage departments (add / rename / deactivate / delete)
- Manage user accounts: create, set password, activate, delete, assign jurisdiction
- Manage geography: districts → taluks → villages / divisions / wards / panchayats
- See every petition in the state

**Officer** — scoped and read-mostly:

- Sees only petitions in the villages/taluks assigned to them, plus anything
  assigned to them by name
- Can **only** change status, add comments, set the next-action date, and attach
  files — enforced in the database, not just the UI. Officers hold no `UPDATE`
  privilege on `petitions`; all changes route through the
  `update_petition_status()` function, which re-checks jurisdiction and writes an
  audit row.

---

## Workflow

```
new → assigned → in_progress → resolved
                            ↘ rejected
```

Every transition writes a row to `petition_status_history` with the old status, the
new status, the comment, who changed it and when. Nothing is overwritten — the
detail page shows the full trail.

---

## Search

The search box on **Petitions** matches across petition number, proceedings number,
outward number, subject, description, petitioner name, father/husband name, phone,
address, writer name and remarks — in Tamil or English. It combines a Postgres
full-text index with trigram matching, so partial words and phone fragments work.

Filters stack on top: status, department, district, taluk, village, and a
received-date range.

Search runs through `search_petitions()` with the caller's own permissions, so an
officer searching the whole state still only sees their own area.

---

## Attachments

Petition copies (PDF or image) can be attached when registering, and officers can
attach proof-of-action files later. Both are optional. Files live in a private
bucket and are served through short-lived signed URLs.

---

## Project layout

```
src/
  app/
    login/                    sign in
    (app)/dashboard/          counts, overdue, recent petitions
    (app)/petitions/          list + keyword search + filters
    (app)/petitions/new/      register a petition (admin)
    (app)/petitions/[id]/     detail, status update, comments, files, history
    (app)/admin/departments/  department master
    (app)/admin/users/        accounts + jurisdiction
    (app)/admin/geography/    district / taluk / village master
  components/                 Shell, Lang (i18n), Emblem, StatusBadge
  i18n/dict.ts                every label in Tamil + English
  lib/                        Supabase clients, types, master-data hook
supabase/migrations/          the SQL that built the database
```

---

## The emblem

`src/components/Emblem.tsx` renders a **placeholder** seal, not the official state
emblem. To use the real one, drop the approved image at `public/emblem.png` and
replace the component body with:

```tsx
<img src="/emblem.png" alt="Government of Tamil Nadu" className={className} />
```

Use of the official Government of Tamil Nadu emblem is restricted — put it in only
if the department deploying this is authorised to.

---

## Suggested next steps

- Change the admin password, then create the real officer accounts
- Add the taluks and villages for the districts you actually cover
  (Coimbatore → Sulur is seeded as a working example)
- Turn on **leaked password protection** in Supabase Auth → Policies
- Consider SMS/email acknowledgement to the petitioner when status changes
