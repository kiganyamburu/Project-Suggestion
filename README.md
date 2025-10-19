# AI GitHub Project Suggestions

This project analyzes GitHub users' profiles and suggests personalized project ideas using Google's Gemini AI. It fetches their public profile and repositories to provide tailored recommendations.

## Demo

[⭐ Check it out here!](https://github-roaster.programordie.workers.dev/)
<img src="demo.gif" alt="demo" width="400px">

## Setup

### Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

## Run locally

If you want to try this on your own machine, you can run this on your localhost:

- Download this repo or clone the code with git.
- Open the folder where you saved the code.
- [Install Wrangler if you haven't done that yet](https://developers.cloudflare.com/workers/wrangler/install-and-update/).
- Install dependencies with `npm install`
- Set your Gemini API key as a secret: `npx wrangler secret put GEMINI_API_KEY` (paste your API key when prompted)
  - For local development, you can also create a `.dev.vars` file with: `GEMINI_API_KEY=your-api-key-here`
- Run the code with `npx wrangler dev`.
- Open the URL in your browser.
- If you want, you can deploy it to Cloudflare with `npx wrangler deploy`

### Thats it!
