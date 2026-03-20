# Elev8 Montreal — AI Marketing Command Center

A full MERN stack AI agent application for marketing the Elev8 Montreal Real Estate, Sales, Marketing & Business Event. Powered by Claude (Anthropic) with GoHighLevel-ready outputs.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend  | Node.js + Express                 |
| Database | MongoDB + Mongoose                |
| AI       | Anthropic Claude Sonnet 4         |
| Styling  | Custom CSS Design System          |

---

## Project Structure

```
elev8-agent/
├── package.json              # Root scripts (concurrently)
│
├── server/
│   ├── index.js              # Express entry point
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── models/
│   │   ├── Generation.js     # AI output records
│   │   └── EventSettings.js  # Event configuration
│   ├── controllers/
│   │   ├── agentController.js    # All Claude API calls
│   │   ├── settingsController.js # CRUD for event settings
│   │   └── historyController.js  # CRUD for generation history
│   ├── routes/
│   │   ├── agents.js
│   │   ├── settings.js
│   │   └── history.js
│   └── middleware/
│       └── errorHandler.js
│
└── client/
    ├── index.html
    ├── vite.config.js         # Proxy /api → localhost:5000
    └── src/
        ├── main.jsx
        ├── App.jsx             # Router + Providers
        ├── index.css           # Global design system
        ├── services/
        │   └── api.js          # Axios service layer
        ├── context/
        │   ├── SettingsContext.jsx
        │   └── ToastContext.jsx
        ├── hooks/
        │   └── useAgent.js     # Reusable agent API hook
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   └── ui/
        │       ├── OutputCard.jsx
        │       └── ContextBar.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── StrategyPage.jsx
            ├── ContentPage.jsx
            ├── EmailPage.jsx
            ├── LeadsPage.jsx
            ├── SettingsPage.jsx
            └── HistoryPage.jsx
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd elev8-agent
npm run install:all
```

### 2. Set up environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/elev8-agent
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLIENT_URL=http://localhost:5173
```

### 3. Run in development

```bash
# From root — starts both server + client
npm run dev
```

- **Client:** http://localhost:5173  
- **API:**    http://localhost:5000/api

---

## API Endpoints

### Agents
| Method | Route                  | Description                  |
|--------|------------------------|------------------------------|
| POST   | `/api/agents/strategy` | Run strategy agent           |
| POST   | `/api/agents/content`  | Run content & copy agent     |
| POST   | `/api/agents/email`    | Run email automation agent   |
| POST   | `/api/agents/leads`    | Run lead qualification agent |

### Settings
| Method | Route            | Description            |
|--------|------------------|------------------------|
| GET    | `/api/settings`  | Get event settings     |
| PUT    | `/api/settings`  | Update event settings  |

### History
| Method | Route                    | Description              |
|--------|--------------------------|--------------------------|
| GET    | `/api/history`           | List all generations     |
| GET    | `/api/history/:id`       | Get single generation    |
| PATCH  | `/api/history/:id/save`  | Save/label a generation  |
| DELETE | `/api/history/:id`       | Delete a generation      |

---

## Deploying to Production

**Backend (Railway / Render):**
- Set `NODE_ENV=production`
- Set `MONGO_URI` to your MongoDB Atlas connection string
- Set `ANTHROPIC_API_KEY`
- Set `CLIENT_URL` to your frontend domain

**Frontend (Vercel / Netlify):**
- Set `VITE_API_URL` if not using same domain
- Update `vite.config.js` proxy for production

---

## GoHighLevel Integration

Every agent output is formatted specifically for GHL:
- **Email sequences** include `{{contact.first_name}}` merge tags
- **Lead reports** include GHL tags to apply and sequences to activate
- All content is copy-paste ready into GHL campaigns and workflows
