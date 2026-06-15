const prisma = require('../config/prisma');

// Criar objetivo (com key results opcionais)
async function createObjective(req, res) {
  try {
    const { title, description, cycle, scope, departmentId, ownerId, parentId, keyResults } = req.body;

    const objective = await prisma.objective.create({
      data: {
        companyId: req.user.companyId,
        title,
        description,
        cycle,
        scope: scope || 'INDIVIDUAL',
        departmentId: departmentId || null,
        ownerId: ownerId || req.user.id,
        parentId: parentId || null,
        keyResults: keyResults
          ? {
              create: keyResults.map(kr => ({
                title: kr.title,
                metricType: kr.metricType || 'NUMBER',
                startValue: kr.startValue || 0,
                targetValue: kr.targetValue,
                currentValue: kr.startValue || 0,
                unit: kr.unit || null,
              })),
            }
          : undefined,
      },
      include: { keyResults: true },
    });

    res.status(201).json(objective);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar objetivos (filtros: cycle, scope, ownerId, departmentId)
async function listObjectives(req, res) {
  try {
    const { cycle, scope, ownerId, departmentId } = req.query;

    const where = { companyId: req.user.companyId };
    if (cycle) where.cycle = cycle;
    if (scope) where.scope = scope;
    if (ownerId) where.ownerId = ownerId;
    if (departmentId) where.departmentId = departmentId;

    const objectives = await prisma.objective.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        keyResults: true,
        parent: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // calcula progresso médio de cada objetivo com base nos KRs
    const withProgress = objectives.map(o => ({
      ...o,
      progress: computeObjectiveProgress(o.keyResults),
    }));

    res.json(withProgress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function computeObjectiveProgress(keyResults) {
  if (!keyResults || keyResults.length === 0) return 0;

  const progresses = keyResults.map(kr => {
    const range = kr.targetValue - kr.startValue;
    if (range === 0) return kr.currentValue >= kr.targetValue ? 100 : 0;
    const pct = ((kr.currentValue - kr.startValue) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  });

  const avg = progresses.reduce((a, b) => a + b, 0) / progresses.length;
  return Math.round(avg);
}

// Detalhe de um objetivo (com filhos alinhados)
async function getObjective(req, res) {
  try {
    const { id } = req.params;

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        keyResults: { include: { checkIns: { orderBy: { createdAt: 'desc' }, take: 5, include: { author: { select: { name: true } } } } } },
        children: { include: { owner: { select: { name: true } }, keyResults: true } },
        parent: { select: { id: true, title: true } },
      },
    });

    if (!objective) return res.status(404).json({ error: 'Objetivo não encontrado' });

    objective.progress = computeObjectiveProgress(objective.keyResults);
    objective.children = objective.children.map(c => ({ ...c, progress: computeObjectiveProgress(c.keyResults) }));

    res.json(objective);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar objetivo (status, título, descrição)
async function updateObjective(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const updated = await prisma.objective.update({
      where: { id },
      data: { title, description, status },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar key result a um objetivo existente
async function addKeyResult(req, res) {
  try {
    const { id } = req.params; // objectiveId
    const { title, metricType, startValue, targetValue, unit } = req.body;

    const kr = await prisma.keyResult.create({
      data: {
        objectiveId: id,
        title,
        metricType: metricType || 'NUMBER',
        startValue: startValue || 0,
        currentValue: startValue || 0,
        targetValue,
        unit: unit || null,
      },
    });

    res.status(201).json(kr);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Check-in de progresso de um Key Result
async function checkInKeyResult(req, res) {
  try {
    const { krId } = req.params;
    const { value, confidence, comment } = req.body;

    const result = await prisma.$transaction(async tx => {
      const updated = await tx.keyResult.update({
        where: { id: krId },
        data: { currentValue: value },
      });

      const checkIn = await tx.keyResultCheckIn.create({
        data: {
          keyResultId: krId,
          value,
          confidence: confidence ?? null,
          comment: comment || null,
          authorId: req.user.id,
        },
      });

      return { keyResult: updated, checkIn };
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Dashboard - visão geral de OKRs por ciclo
async function getOKRDashboard(req, res) {
  try {
    const { cycle } = req.query;
    if (!cycle) return res.status(400).json({ error: 'Parâmetro cycle é obrigatório' });

    const objectives = await prisma.objective.findMany({
      where: { companyId: req.user.companyId, cycle },
      include: { keyResults: true, owner: { select: { name: true } } },
    });

    const withProgress = objectives.map(o => ({ ...o, progress: computeObjectiveProgress(o.keyResults) }));

    const byScope = {
      COMPANY: withProgress.filter(o => o.scope === 'COMPANY'),
      DEPARTMENT: withProgress.filter(o => o.scope === 'DEPARTMENT'),
      INDIVIDUAL: withProgress.filter(o => o.scope === 'INDIVIDUAL'),
    };

    const overallAvg = withProgress.length
      ? Math.round(withProgress.reduce((sum, o) => sum + o.progress, 0) / withProgress.length)
      : 0;

    const statusCounts = withProgress.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ cycle, overallProgress: overallAvg, statusCounts, byScope });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createObjective,
  listObjectives,
  getObjective,
  updateObjective,
  addKeyResult,
  checkInKeyResult,
  getOKRDashboard,
};
