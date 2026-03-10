# Animus Exporter

Chrome extension for exporting bookmarks from social platforms.

## Supported Platforms

| Platform | Status | Export Format |
|----------|--------|---------------|
| Twitter / X | Available | Tweet IDs |
| Instagram | Available | Post URLs |

## Output Formats

### Twitter

```json
{
  "type": "twitter",
  "items": [
    { "id": "1893456789012345678" },
    { "id": "1891234567890123456" }
  ]
}
```

### Instagram

```json
{
  "type": "instagram",
  "items": [
    { "url": "arielyu.fit/p/DS2jhe0jrWK" },
    { "url": "zeemallick/p/DTonFIMjDL3" }
  ]
}
```

Each exporter produces a typed JSON file with a `type` discriminator and an `items` array containing platform-specific identifiers.

## How It Works

### Twitter

1. Click the extension icon and select **Twitter / X Bookmarks**
2. The extension opens `x.com/i/bookmarks/all` in a background tab
3. Authentication headers are captured automatically from your active session
4. Bookmarks are fetched via Twitter's GraphQL API (100 per page, paginated)
5. A JSON file containing all bookmark tweet IDs is downloaded via Save As dialog

### Instagram

1. Click the extension icon and select **Instagram Saved**
2. The extension opens `instagram.com` in a background tab to capture auth headers
3. Saved posts are fetched via Instagram's REST API (`/api/v1/feed/saved/posts/`), paginated
4. A JSON file containing all saved post URLs is downloaded via Save As dialog

No credentials are stored permanently. Auth tokens are captured from your existing browser session and held in local storage only for the duration of the export.

## Setup

### Prerequisites

- Node.js 24.11.0+
- npm

### Install & Build

```bash
npm install
npm run build        # Production build
```

### Development

```bash
npm run dev          # Watch mode with source maps
```

### Load in Chrome

1. Build the extension (`npm run build`)
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` directory

### Testing

```bash
npm test             # Run tests
npm run test:coverage # Run with coverage
npm run typecheck     # Type checking
```

## Project Structure

```
src/
├── background/
│   ├── background.ts              # Service worker entry, message routing
│   ├── twitter-auth.ts            # webRequest header capture for Twitter auth
│   ├── twitter-bookmarks.ts       # GraphQL bookmark fetching and JSON export
│   ├── instagram-auth.ts          # webRequest header capture for Instagram auth
│   └── instagram-bookmarks.ts     # REST API saved post fetching and JSON export
├── popup/
│   ├── popup.html                 # Extension popup UI
│   └── index.ts                   # Button handlers and status updates
└── types/
    └── global.d.ts                # Chrome API type declarations
```

## Adding a New Exporter

Each exporter follows the same pattern:

1. Create `src/background/<platform>-auth.ts` for session capture
2. Create `src/background/<platform>-bookmarks.ts` for data fetching and export
3. Add a message handler in `background.ts` (e.g., `exportRedditBookmarks`)
4. Add a button to `popup.html` with the platform icon
5. Wire the button in `popup/index.ts`
6. Update `manifests/manifest.json` with any new host permissions

## Permissions

| Permission | Reason |
|-----------|--------|
| `storage` | Temporarily store auth tokens during export |
| `downloads` | Save the exported JSON file |
| `webRequest` | Capture authentication headers from active sessions |
| `*://x.com/*` | Access Twitter/X API |
| `*://twitter.com/*` | Access Twitter legacy domain |
| `*://www.instagram.com/*` | Access Instagram API |

## Tech Stack

- TypeScript, esbuild, Manifest V3
- Vitest + happy-dom for testing
- No external runtime dependencies
