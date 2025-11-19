# Mindful Chat Interface

A web + mobile chat interface project that integrates with Supabase and a serverless function (Google Gemini) for a compassionate mental-health assistant.

This README covers local setup, running the web app (Vite), running the mobile app (Expo), and the Supabase function used as the API backend.

**Repo layout (important folders):**
- `src/` — Web frontend (Vite + React + TypeScript)
- `mobile/` — React Native (Expo) mobile app
- `supabase/functions/mental-health-chat/` — Serverless function that proxies to Google Gemini
- `supabase/migrations/` — DB migrations and RLS changes

**Quick overview of what to run locally**
- Web: `npm install` → `npm run dev` (from repo root)
- Mobile: `cd mobile && npm install` → `npm start` (runs `expo start`)
- Supabase functions: `supabase functions serve` or deploy with `supabase functions deploy`

**Note about macOS quarantine issues**: If you downloaded this repo via a messenger (WhatsApp, etc.) you might see errors like `/usr/bin/env: bad interpreter: Operation not permitted` when running `npx expo start`. Fix by clearing the quarantine attribute:

```bash
# from the `mobile/` directory
xattr -dr com.apple.quarantine node_modules
```

## Prerequisites

- Node.js (LTS recommended) and `npm` or `pnpm`.
- For the mobile app: `expo` (installed via `npm install` in `mobile/`), and an emulator or the Expo Go app.
- Supabase CLI (optional, for running/deploying functions and migrations): https://supabase.com/docs/guides/cli
- A Supabase project (for DB + Functions) and a Google Gemini API key (environment var `GEMINI_API_KEY`) if you want the AI backend working.

## Environment variables

Create environment variables for the web and mobile apps. Example files:

- Web (`.env` in repo root or set in your environment):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
VITE_GEMINI_ENABLED=true # optional flag if your web app needs to show Gemini features
```

- Mobile (you can store these in `mobile/app.json` or use `expo env` / secrets):

```json
{
	"expo": {
		"extra": {
			"SUPABASE_URL": "https://your-project.supabase.co",
			"SUPABASE_ANON_KEY": "your-supabase-anon-key"
		}
	}
}
```

Important env for the serverless function:
- `GEMINI_API_KEY` — required by `supabase/functions/mental-health-chat` to call the Google Gemini API.

## Web (Vite) — local setup

1. From repository root:

```bash
npm install
npm run dev
```

2. Open the printed `http://` dev URL.

Notes:
- The web frontend uses the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables. The client code creates a Supabase client in `src/integrations/supabase/client.ts`.

## Mobile (Expo) — local setup

1. From `mobile/` folder:

```bash
cd mobile
npm install
npm start
```

2. Use Expo Go on your phone or an emulator. Run `npm run android` or `npm run ios` to open directly where supported.

If you hit `/usr/bin/env: bad interpreter` errors on macOS when running `npx expo start`, clear the quarantine attributes as shown above.

## Supabase serverless function — `mental-health-chat`

Location: `supabase/functions/mental-health-chat/index.ts`

What it does:
- Receives a POST JSON body containing `messages` (array of chat messages).
- Uses the environment variable `GEMINI_API_KEY` to call Google Gemini's streaming API and relays the SSE stream back to the client.

Expected request (JSON):

```json
{
	"messages": [
		{ "role": "system", "content": "..." },
		{ "role": "user", "content": "Hello" }
	]
}
```

Headers: include `Authorization: Bearer <PUBLISHABLE_KEY>` when calling the function from the web app (the app uses `VITE_SUPABASE_PUBLISHABLE_KEY`).

Response:
- Streamed SSE (`text/event-stream`) from Gemini on success.
- JSON error payload with HTTP status codes on failure.

Run locally with Supabase CLI (recommended for development):

```bash
# from repo root
supabase functions serve --no-verify-jwt --project-ref <your-project-ref>
# or run only the function directory
cd supabase/functions/mental-health-chat
supabase functions serve
```

Deploy to Supabase:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy mental-health-chat
```

Make sure you set the `GEMINI_API_KEY` environment variable in your Supabase project settings or via the CLI before deploying.

## API usage (web frontend)

The web app calls the function at:

```
${VITE_SUPABASE_URL}/functions/v1/mental-health-chat
```

Include header:

```
Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}
Content-Type: application/json
```

The function returns a streaming response; the web frontend expects an SSE stream and renders assistant tokens as they arrive.

## Troubleshooting

- `bad interpreter: Operation not permitted` when running `expo`: clear quarantine attributes with `xattr -dr com.apple.quarantine node_modules` inside `mobile/`.
- If the Supabase client fails, verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set and match your Supabase project.
- For function errors, check server logs and ensure `GEMINI_API_KEY` is set and valid.

## Useful commands

- Root web dev:

```bash
npm install
npm run dev
```

- Build web for production:

```bash
npm run build
npm run preview
```

- Mobile (Expo):

```bash
cd mobile
npm install
npm start
# then use Expo Go or run android/ios scripts
```

- Supabase functions (local):

```bash
supabase functions serve
```

## Next steps / Notes

- Use a `.env` file or your CI/CD secret store for keys. Do not commit secret keys to git.
- If you'd like, I can also:
	- Add a `.env.example` file with the required keys (non-secret placeholders).
	- Add a small run script to start web + mobile concurrently.

---
=======
# Mental_Health_Chatbot_Application
Mental_Health_Chatbot_Application is an AI-powered support tool that provides empathetic, non-judgmental conversations to help users manage stress, anxiety, and emotional challenges. It offers coping tips, mood support, and guidance while prioritizing safety and encouraging professional help when needed.
>>>>>>> 8ede3d8d529767bfcd6962c2fa84a697ab84e150

OUTPUT:
<img width="400" height="622" alt="APP " src="https://github.com/user-attachments/assets/3082c295-f0d5-4a31-89e1-f1453fc5fff8" />

Home Page:
<img width="400" height="622" alt="Home page" src="https://github.com/user-attachments/assets/8349f8e9-5e76-4268-bef2-c0560b81700b" />

Conversation Page:
<img width="400" height="622" alt="Conversation page" src="https://github.com/user-attachments/assets/f936502c-88e6-4e10-ba2e-81d7b4f079b6" />

Chats Page:
<img width="400" height="622" alt="Chats page" src="https://github.com/user-attachments/assets/262862fc-881a-4324-8651-7499e41ce294" />


