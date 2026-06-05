# Panda AI

Panda AI is a responsive React + Vite chatbot app for study help, homework support, image-aware prompts, and daily productivity.

## Features

- Responsive chat UI for mobile, tablet, laptop, and desktop
- Installable PWA with web app manifest and service worker
- Offline-ready app shell with cached static assets
- Auto-update prompt when a new version is available
- Cerebras and Gemini model support
- Image upload, mobile camera capture, and desktop screenshot capture
- Dark and light theme support

## Tech Stack

- Vite
- TypeScript
- React
- Tailwind CSS
- shadcn-ui
- vite-plugin-pwa

## Local Development

```sh
npm install
npm run dev
```

## Production Build

```sh
npm run build
npm run preview
```

The production build generates the PWA service worker and manifest assets.
