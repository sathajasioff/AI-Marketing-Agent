import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Routes
import authRoutes            from './routes/auth.js';
import agentRoutes           from './routes/agents.js';
import settingsRoutes        from './routes/settings.js';
import historyRoutes         from './routes/history.js';
import ghlRoutes             from './routes/ghl.js';
import ghlAccountsRoutes     from './routes/ghlAccounts.js';
import learningRoutes        from './routes/learning.js';
import leadIntelligenceRoutes from './routes/leadIntelligence.js';
import knowledgeRoutes       from './routes/knowledge.js';
import metaRoutes            from './routes/meta.js';
import integrationRoutes     from './routes/integrations.js';
import errorHandler          from './middleware/errorHandler.js';
import adminRoutes from './routes/admin.js';

// Auth middleware
import { protect, checkLimit } from './middleware/auth.js';

const app  = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Public routes (no auth) ──
app.use('/api/auth', authRoutes);

// ── Protected routes (must be logged in) ──
app.use('/api/agents',       protect, checkLimit, agentRoutes);
app.use('/api/settings',     protect, settingsRoutes);
app.use('/api/history',      protect, historyRoutes);
app.use('/api/ghl',          protect, ghlRoutes);
app.use('/api/ghl-accounts', protect, ghlAccountsRoutes);
app.use('/api/learning',     protect, learningRoutes);
app.use('/api/intelligence', protect, checkLimit, leadIntelligenceRoutes);
app.use('/api/knowledge',    protect, knowledgeRoutes);
app.use('/api/meta',         protect, metaRoutes);
app.use('/api/integrations', protect, integrationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
