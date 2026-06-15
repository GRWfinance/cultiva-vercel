const prisma = require('../config/prisma');

// Dashboard geral de pessoas - headcount, turnover, distribuição
async function getOverview(req, res) {
  try {
    const companyId = req.user.companyId;

    const [totalActive, totalInactive, departments] = await Promise.all([
      prisma.user.count({ where: { companyId, active: true } }),
      prisma.user.count({ where: { companyId, active: false } }),
      prisma.department.findMany({
        where: { companyId },
        include: { users: { where: { active: true }, select: { id: true, hireDate: true, role: true } } },
      }),
    ]);

    const headcountByDepartment = departments.map(d => ({
      department: d.name,
      headcount: d.users.length,
    }));

    // Distribuição por tempo de empresa (tenure)
    const now = Date.now();
    const tenureBuckets = { '< 1 ano': 0, '1-3 anos': 0, '3-5 anos': 0, '5+ anos': 0 };
    departments.forEach(d => d.users.forEach(u => {
      if (!u.hireDate) return;
      const years = (now - new Date(u.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years < 1) tenureBuckets['< 1 ano']++;
      else if (years < 3) tenureBuckets['1-3 anos']++;
      else if (years < 5) tenureBuckets['3-5 anos']++;
      else tenureBuckets['5+ anos']++;
    }));

    // Distribuição por papel
    const roleCounts = {};
    departments.forEach(d => d.users.forEach(u => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    }));

    // Turnover simplificado: inativos / (ativos + inativos)
    const total = totalActive + totalInactive;
    const turnoverRate = total > 0 ? Math.round((totalInactive / total) * 1000) / 10 : 0;

    res.json({
      headcount: { active: totalActive, inactive: totalInactive, total },
      turnoverRate,
      headcountByDepartment,
      tenureDistribution: tenureBuckets,
      roleDistribution: roleCounts,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Engajamento - agrega resultados de pesquisas recentes
async function getEngagementOverview(req, res) {
  try {
    const companyId = req.user.companyId;

    const surveys = await prisma.survey.findMany({
      where: { companyId, status: 'CLOSED' },
      include: { questions: { include: { answers: true } } },
      orderBy: { endDate: 'desc' },
      take: 5,
    });

    const results = surveys.map(s => {
      const scaleAnswers = s.questions.flatMap(q => q.type === 'SCALE' ? q.answers.map(a => parseFloat(a.value)) : []);
      const avg = scaleAnswers.length ? scaleAnswers.reduce((a, b) => a + b, 0) / scaleAnswers.length : null;

      let enps = null;
      if (s.type === 'ENPS' && scaleAnswers.length) {
        const promoters = scaleAnswers.filter(v => v >= 9).length;
        const detractors = scaleAnswers.filter(v => v <= 6).length;
        enps = Math.round(((promoters - detractors) / scaleAnswers.length) * 100);
      }

      return { surveyId: s.id, title: s.title, type: s.type, average: avg ? Math.round(avg * 100) / 100 : null, enps };
    });

    res.json({ recentSurveys: results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Performance - distribuição de scores de avaliação do ciclo mais recente
async function getPerformanceOverview(req, res) {
  try {
    const companyId = req.user.companyId;

    const latestCycle = await prisma.reviewCycle.findFirst({
      where: { companyId, status: 'CLOSED' },
      orderBy: { endDate: 'desc' },
      include: { participants: true },
    });

    if (!latestCycle) return res.json({ cycle: null, distribution: {}, average: null });

    const scores = latestCycle.participants.map(p => p.overallScore).filter(s => s != null);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const distribution = { '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
    scores.forEach(s => {
      if (s < 2) distribution['1-2']++;
      else if (s < 3) distribution['2-3']++;
      else if (s < 4) distribution['3-4']++;
      else distribution['4-5']++;
    });

    res.json({
      cycle: { id: latestCycle.id, name: latestCycle.name },
      average: avg ? Math.round(avg * 100) / 100 : null,
      distribution,
      totalEvaluated: scores.length,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Learning - participação em treinamentos
async function getLearningOverview(req, res) {
  try {
    const companyId = req.user.companyId;

    const courses = await prisma.course.findMany({
      where: { companyId },
      include: { enrollments: true },
    });

    const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollments.length, 0);
    const totalCompletions = courses.reduce((sum, c) => sum + c.enrollments.filter(e => e.status === 'COMPLETED').length, 0);
    const completionRate = totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;

    const topCourses = courses
      .map(c => ({ title: c.title, enrollments: c.enrollments.length, completions: c.enrollments.filter(e => e.status === 'COMPLETED').length }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    res.json({ totalEnrollments, totalCompletions, completionRate, topCourses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getOverview,
  getEngagementOverview,
  getPerformanceOverview,
  getLearningOverview,
};
