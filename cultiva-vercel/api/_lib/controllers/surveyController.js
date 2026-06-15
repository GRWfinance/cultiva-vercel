const prisma = require('../config/prisma');

// Criar pesquisa (com perguntas)
async function createSurvey(req, res) {
  try {
    const { title, description, type, anonymous, startDate, endDate, questions } = req.body;

    const survey = await prisma.survey.create({
      data: {
        companyId: req.user.companyId,
        creatorId: req.user.id,
        title,
        description,
        type: type || 'PULSE',
        anonymous: anonymous !== false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        questions: questions
          ? {
              create: questions.map((q, idx) => ({
                text: q.text,
                type: q.type || 'SCALE',
                order: idx,
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });

    res.status(201).json(survey);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar pesquisas da empresa
async function listSurveys(req, res) {
  try {
    const { status } = req.query;
    const where = { companyId: req.user.companyId };
    if (status) where.status = status;

    const surveys = await prisma.survey.findMany({
      where,
      include: { questions: true, _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(surveys.map(s => ({ ...s, responsesCount: s._count.responses, _count: undefined })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Ativar pesquisa
async function activateSurvey(req, res) {
  try {
    const { id } = req.params;
    const updated = await prisma.survey.update({ where: { id }, data: { status: 'ACTIVE' } });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Encerrar pesquisa
async function closeSurvey(req, res) {
  try {
    const { id } = req.params;
    const updated = await prisma.survey.update({ where: { id }, data: { status: 'CLOSED' } });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Pesquisas ativas que o usuário ainda não respondeu
async function listAvailableSurveys(req, res) {
  try {
    const surveys = await prisma.survey.findMany({
      where: {
        companyId: req.user.companyId,
        status: 'ACTIVE',
      },
      include: { questions: { orderBy: { order: 'asc' } }, responses: { where: { userId: req.user.id } } },
    });

    // Filtra as que o usuário já respondeu (apenas se não anônima, pois anônimas não vinculam userId)
    const available = surveys.filter(s => s.anonymous || s.responses.length === 0);

    res.json(available.map(s => ({ ...s, responses: undefined })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Responder pesquisa
async function submitResponse(req, res) {
  try {
    const { id } = req.params; // surveyId
    const { answers } = req.body; // [{ questionId, value }]

    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada' });
    if (survey.status !== 'ACTIVE') return res.status(400).json({ error: 'Pesquisa não está ativa' });

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        userId: survey.anonymous ? null : req.user.id,
        answers: {
          create: answers.map(a => ({ questionId: a.questionId, value: String(a.value) })),
        },
      },
      include: { answers: true },
    });

    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Resultados/analytics de uma pesquisa
async function getSurveyResults(req, res) {
  try {
    const { id } = req.params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' }, include: { answers: true } },
        responses: true,
      },
    });

    if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada' });

    const totalResponses = survey.responses.length;

    const questionResults = survey.questions.map(q => {
      if (q.type === 'SCALE') {
        const values = q.answers.map(a => parseFloat(a.value)).filter(v => !isNaN(v));
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

        // eNPS: promotores (9-10) - detratores (0-6)
        let enps = null;
        if (survey.type === 'ENPS' && values.length) {
          const promoters = values.filter(v => v >= 9).length;
          const detractors = values.filter(v => v <= 6).length;
          enps = Math.round(((promoters - detractors) / values.length) * 100);
        }

        // distribuição
        const distribution = {};
        values.forEach(v => { distribution[v] = (distribution[v] || 0) + 1; });

        return { questionId: q.id, text: q.text, type: q.type, average: avg ? Math.round(avg * 100) / 100 : null, enps, distribution, responseCount: values.length };
      }

      if (q.type === 'TEXT') {
        return { questionId: q.id, text: q.text, type: q.type, responses: q.answers.map(a => a.value), responseCount: q.answers.length };
      }

      // MULTIPLE_CHOICE
      const counts = {};
      q.answers.forEach(a => { counts[a.value] = (counts[a.value] || 0) + 1; });
      return { questionId: q.id, text: q.text, type: q.type, counts, responseCount: q.answers.length };
    });

    res.json({
      survey: { id: survey.id, title: survey.title, type: survey.type, anonymous: survey.anonymous },
      totalResponses,
      questionResults,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createSurvey,
  listSurveys,
  activateSurvey,
  closeSurvey,
  listAvailableSurveys,
  submitResponse,
  getSurveyResults,
};
