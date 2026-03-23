import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import agentRoutes           from './routes/agents.js';
import settingsRoutes        from './routes/settings.js';
import historyRoutes         from './routes/history.js';
import ghlRoutes             from './routes/ghl.js';
import learningRoutes        from './routes/learning.js';
import leadIntelligenceRoutes from './routes/leadIntelligence.js';
import knowledgeRoutes       from './routes/knowledge.js';
import errorHandler          from './middleware/errorHandler.js';
import ghlAccountRoutes from './routes/ghlAccounts.js';
import integrationRoutes from './routes/integrations.js';
import metaRoutes        from './routes/meta.js';




const app  = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/agents',      agentRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/history',     historyRoutes);
app.use('/api/ghl',         ghlRoutes);
app.use('/api/learning',    learningRoutes);
app.use('/api/intelligence', leadIntelligenceRoutes);
app.use('/api/knowledge',   knowledgeRoutes);
app.use('/api/ghl-accounts', ghlAccountRoutes);
// Add to route mounts
app.use('/api/integrations', integrationRoutes);
app.use('/api/meta',         metaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Elev8 AI Agent API running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});
