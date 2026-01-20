# Address Scanner

A web application for scanning and recognizing addresses from images using OCR technology.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd address-scanner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon/public key

### 4. Configure environment variables

**IMPORTANT:** The app will not run without this step!

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your actual Supabase project URL and anon key from step 3.

### 5. Run database migrations

The database migrations are located in `supabase/migrations/`. Apply them in your Supabase project:

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20260120125229_add_structured_address_fields.sql`
3. Paste and run the SQL in the editor

### 6. Deploy the Edge Function (Optional)

The app uses a Supabase Edge Function for address parsing. To deploy it:

1. The function code is in `supabase/functions/parse-address/index.ts`
2. Deploy using the Supabase dashboard or CLI

Note: The app will work without the edge function, but address parsing won't be available.

### 7. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

- Scan addresses from images using OCR
- Parse address components (name, street, postal code, etc.)
- Save and view address history
- Responsive design for mobile and desktop

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Supabase (Database + Edge Functions)
- Tesseract.js (OCR)

## Troubleshooting

### App doesn't load

Make sure you've created the `.env` file with valid Supabase credentials. Check the browser console for error messages.

### Database errors

Ensure you've run the database migrations in your Supabase project.
