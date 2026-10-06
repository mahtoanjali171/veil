# VEIL — Pre-LLM Privacy Firewall
privashield:A boundary between user and LLM
VEIL is a privacy-focused security layer designed to detect sensitive information in user input before it reaches a Large Language Model (LLM).

The project helps identify potentially sensitive data such as personally identifiable information (PII), contact information, credentials, and other confidential content, allowing users to review and protect their data before sharing it with an AI system.

## Features

* 🔍 Sensitive data detection
* 🛡️ Privacy risk assessment
* 📊 Risk score visualization
* 🧹 Detection and review of sensitive information
* 📜 Scan history interface
* 📄 Document-related privacy workflows
* ⚙️ Configurable privacy policies
* 📱 Responsive user interface

## Tech Stack

* **React** — Frontend UI
* **TypeScript** — Type-safe development
* **Vite** — Development and build tool
* **TanStack Start** — Application routing and server capabilities
* **Tailwind CSS** — Styling
* **Vitest** — Testing
* **Vercel** — Deployment

## Project Structure

```text
veil/
├── public/
│   ├── favicon.svg
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── shield/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Diagrams.tsx
│   │   │   ├── Marketing.tsx
│   │   │   ├── RiskScore.tsx
│   │   │   ├── Scanner.tsx
│   │   │   └── tokens.tsx
│   │   │
│   │   └── ui/
│   │       └── Reusable UI components
│   │
│   ├── hooks/
│   │   └── Custom React hooks
│   │
│   ├── lib/
│   │   ├── detection.ts
│   │   ├── store.ts
│   │   ├── utils.ts
│   │   ├── error-capture.ts
│   │   └── error-page.ts
│   │
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   ├── scanner.tsx
│   │   ├── documents.tsx
│   │   ├── history.tsx
│   │   ├── policies.tsx
│   │   ├── settings.tsx
│   │   └── about.tsx
│   │
│   ├── test/
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
└── vercel.json
```

## How It Works

The basic privacy-protection workflow is:

```text
User Input
    ↓
Privacy Scanner
    ↓
Sensitive Data Detection
    ↓
Risk Assessment
    ↓
User Review
    ↓
Protected / Safe Output
```

The detection logic is primarily handled by:

```text
src/lib/detection.ts
```

while the scanning interface is implemented in:

```text
src/components/shield/Scanner.tsx
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd veil
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The application will be available at the local URL shown in your terminal.

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run start
```

## Testing

Run the test suite with:

```bash
npm run test
```

## Environment Variables

If environment variables are required in future backend/API integrations, create a `.env` file:

```env
# Example
API_URL=
API_KEY=
```

Do not commit secrets or API keys to GitHub.

## Current Architecture

VEIL currently focuses primarily on the application and privacy-scanning layer.

```text
React / TypeScript
        │
        ├── Scanner UI
        ├── Risk Assessment
        ├── Detection Logic
        ├── Policies
        └── History
```

A dedicated backend, database, and LLM integration can be added as the project evolves.

## Future Improvements

* Backend API for centralized processing
* Advanced PII detection
* Named Entity Recognition (NER)
* Credential and secret detection
* Sensitive document scanning
* Automatic data masking/redaction
* LLM integration
* Authentication and authorization
* Database-backed scan history
* Organization-level privacy policies
* Audit logs
* API security and rate limiting

## Security

VEIL is designed with a privacy-first approach.

Sensitive information should be handled carefully, and API keys, credentials, and other secrets should never be committed to the repository.

## License

This project is intended for educational, research, and hackathon purposes.

Add an appropriate open-source license if the project is intended for public distribution.
