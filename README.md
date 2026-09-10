# AI Bug-Fixer Agent

An AI-powered debugging agent that scans source code, detects common bugs, generates fixes, and applies them automatically.

## Features

- Scan JavaScript, TypeScript, Python, JSX, TSX, HTML, CSS, and JSON files
- Detect logic, syntax, null/undefined, off-by-one, and obvious security issues
- AI-powered bug analysis using Groq
- Automatically apply generated fixes
- Create `.bak` backups before modifying files
- View original vs fixed code using Monaco Diff Editor
- Real-time scan logs using WebSocket

## Tech Stack

- React + Vite
- Node.js + Express
- WebSocket
- Groq API
- Monaco Editor
- Tailwind CSS

## How It Works

1. Enter your project folder path.
2. Run the AI agent.
3. The agent scans supported files.
4. AI analyzes each file for concrete bugs.
5. If a bug is found, a corrected version is generated.
6. The original file is backed up as `.bak`.
7. The fix is applied and can be reviewed in the diff viewer.

