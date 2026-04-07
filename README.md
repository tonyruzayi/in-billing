# Information Networking — Billing System

> A full-featured invoicing and quotation management system for **Information Networking (Botswana)**.
> Built with React · Supabase · Netlify.

---

## Features

| Feature | Details |
|---|---|
| 🔐 Authentication | Email/password login via Supabase Auth |
| 📋 Quotations | Auto-numbered (QUO-001…), full line items, VAT, discount |
| 🧾 Invoices | Auto-numbered (INV-001…), direct or from a quotation |
| 🔍 Quote → Invoice | Search & load any quotation into a new invoice |
| 💳 Part Payments | Record multiple payments; balance auto-deducts; status auto-updates |
| 📄 PDF Export | Professional branded PDF for quotes and invoices |
| 📊 Excel Export | XLSX export matching the IN template layout |
| 📧 Email | Opens your mail client pre-filled (attach PDF manually) |
| 📊 Dashboard | Summary stats + recent documents |
| 🔎 Search & Filter | Full-text search + status filter on all lists |

---

## Tech Stack

- **Frontend**: React 18, React Router v6
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **PDF**: jsPDF + jspdf-autotable
- **Excel**: SheetJS (xlsx)
- **Hosting**: Netlify (static build)
- **Fonts**: Syne + DM Sans (Google Fonts)

---

## 🚀 Deployment Guide

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Give it a name (e.g. `in-billing`) and choose a strong database password
3. Once created, go to **SQL Editor** → **New Query**
4. Paste the entire contents of **`supabase_schema.sql`** and click **Run**
5. Go to **Authentication → Users** → **Add User** → create your login credentials
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key**

---

### Step 2 — Push to GitHub

```bash
# In your terminal, inside the project folder:
git init
git add .
git commit -m "Initial commit - IN Billing System"

# Create a new repo on github.com (don't add README/gitignore)
git remote add origin https://github.com/YOUR_USERNAME/in-billing.git
git branch -M main
git push -u origin main
```

---

### Step 3 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Choose your GitHub repo
3. Build settings (auto-detected from `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Click **Show advanced** → **New variable** — add these two:

| Key | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Click **Deploy site** — Netlify will build and publish it
6. Optionally set a custom domain in **Domain settings**

---

### Step 4 — Log In

- Visit your Netlify URL
- Sign in with the user you created in Supabase Auth (Step 1, point 5)
- Done — start creating quotes and invoices!

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/in-billing.git
cd in-billing

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key

# Start dev server
npm start
# Opens at http://localhost:3000
```

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js        # Supabase client
│   ├── pdfGenerator.js    # PDF export (quotes + invoices)
│   └── excelExport.js     # Excel/XLSX export
├── hooks/
│   └── useAuth.js         # Auth state hook
├── components/
│   └── Layout.js          # Sidebar + shell
├── pages/
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Quotations.js      # List
│   ├── QuoteForm.js       # Create / Edit
│   ├── QuoteDetail.js     # View + actions
│   ├── Invoices.js        # List
│   ├── InvoiceForm.js     # Create / Edit (+ load from quote)
│   └── InvoiceDetail.js   # View + payments
├── App.js                 # Router
├── App.css                # All styles
└── index.js
```

---

## How Numbering Works

- Quotations: **QUO-001**, QUO-002, … (auto-incremented from last DB record)
- Invoices: **INV-001**, INV-002, … (same logic)
- Both can be manually overridden in the form if needed

## Part Payments

1. Open any invoice
2. Click **Record Payment**
3. Enter amount, date, method, and optional reference
4. The system deducts from the total and updates:
   - **Amount Paid** = sum of all payments
   - **Balance Due** = total − amount paid
   - **Status**: `unpaid` → `partial` → `paid` (automatic)
5. Remove a payment to reverse it

## Invoice Without Quotation

Simply go to **Invoices → New Invoice** — no quotation is required. The "Load from Quote" button is optional.

---

## Supabase Auth — Adding More Users

- Supabase Dashboard → **Authentication → Users → Invite user**
- Or enable sign-ups: **Authentication → Settings → Enable email signups**

---

## License

Private — Information Networking © 2026. All rights reserved.
