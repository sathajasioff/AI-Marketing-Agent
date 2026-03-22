import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { env } from './config/env.js';
import agentRoutes from './routes/agents.js';
import settingsRoutes from './routes/settings.js';
import historyRoutes from './routes/history.js';
import errorHandler from './middleware/errorHandler.js';
import ghlRoutes      from './routes/ghl.js';
import learningRoutes from './routes/learning.js';
import knowledgeRoutes from './routes/knowledge.js';


const app = express();
const PORT = env.PORT;

// ── Connect to MongoDB ──
connectDB();

// ── Middleware ──
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

// ── Routes ──
app.use('/api/agents', agentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ghl',      ghlRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Elev8 Montreal AI Agent API running' });
});

// ── Error handler (must be last) ──
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Elev8 Agent Server running on http://localhost:${PORT}`);
});
