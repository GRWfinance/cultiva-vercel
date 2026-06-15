const express = require('express');
const cors = require('cors');

const authRoutes = require('./_lib/routes/authRoutes');
const oneOnOneRoutes = require('./_lib/routes/oneOnOneRoutes');
const feedbackRoutes = require('./_lib/routes/feedbackRoutes');
const benefitRoutes = require('./_lib/routes/benefitRoutes');
const okrRoutes = require('./_lib/routes/okrRoutes');
const pdiRoutes = require('./_lib/routes/pdiRoutes');
const reviewRoutes = require('./_lib/routes/reviewRoutes');
const surveyRoutes = require('./_lib/routes/surveyRoutes');
const kudosRoutes = require('./_lib/routes/kudosRoutes');
const successionRoutes = require('./_lib/routes/successionRoutes');
const learningRoutes = require('./_lib/routes/learningRoutes');
const peopleAnalyticsRoutes = require('./_lib/routes/peopleAnalyticsRoutes');
const seedRoute = require('./_lib/routes/seedRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Rotas - prefixadas com /api porque o Vercel encaminha o path completo
app.use('/api/auth', authRoutes);
app.use('/api/one-on-ones', oneOnOneRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/okrs', okrRoutes);
app.use('/api/pdis', pdiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/kudos', kudosRoutes);
app.use('/api/succession', successionRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/people-analytics', peopleAnalyticsRoutes);
app.use('/api/seed', seedRoute);

// Tratamento de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
