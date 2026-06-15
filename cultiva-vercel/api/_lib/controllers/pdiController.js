const prisma = require('../config/prisma');

// Criar PDI (com metas opcionais)
async function createPDI(req, res) {
  try {
    const { title, cycle, ownerId, managerId, goals } = req.body;

    const pdi = await prisma.pDI.create({
      data: {
        title,
        cycle,
        ownerId: ownerId || req.user.id,
        managerId: managerId || null,
        goals: goals
          ? {
              create: goals.map(g => ({
                title: g.title,
                description: g.description || null,
                category: g.category || 'SKILL',
                targetDate: g.targetDate ? new Date(g.targetDate) : null,
              })),
            }
          : undefined,
      },
      include: { goals: true },
    });

    res.status(201).json(pdi);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar PDIs (próprios, ou de um liderado se for gestor/RH)
async function listPDIs(req, res) {
  try {
    const { userId } = req.query;
    const targetUserId = userId || req.user.id;

    // Se consultando de outra pessoa, valida permissão
    if (userId && userId !== req.user.id) {
      const target = await prisma.user.findUnique({ where: { id: userId } });
      const isManager = target?.managerId === req.user.id;
      const isHR = ['ADMIN', 'HR'].includes(req.user.role);
      if (!isManager && !isHR) return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const pdis = await prisma.pDI.findMany({
      where: { ownerId: targetUserId },
      include: { goals: true, owner: { select: { name: true } }, manager: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const withProgress = pdis.map(p => ({
      ...p,
      overallProgress: computeOverallProgress(p.goals),
    }));

    res.json(withProgress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function computeOverallProgress(goals) {
  if (!goals || goals.length === 0) return 0;
  const avg = goals.reduce((sum, g) => sum + g.progress, 0) / goals.length;
  return Math.round(avg);
}

// Detalhe de um PDI
async function getPDI(req, res) {
  try {
    const { id } = req.params;

    const pdi = await prisma.pDI.findUnique({
      where: { id },
      include: { goals: true, owner: { select: { id: true, name: true } }, manager: { select: { id: true, name: true } } },
    });

    if (!pdi) return res.status(404).json({ error: 'PDI não encontrado' });

    pdi.overallProgress = computeOverallProgress(pdi.goals);
    res.json(pdi);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar status geral do PDI
async function updatePDI(req, res) {
  try {
    const { id } = req.params;
    const { title, status, managerId } = req.body;

    const updated = await prisma.pDI.update({
      where: { id },
      data: { title, status, managerId },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar meta a um PDI
async function addGoal(req, res) {
  try {
    const { id } = req.params; // pdiId
    const { title, description, category, targetDate } = req.body;

    const goal = await prisma.pDIGoal.create({
      data: {
        pdiId: id,
        title,
        description: description || null,
        category: category || 'SKILL',
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    });

    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar progresso/status de uma meta
async function updateGoal(req, res) {
  try {
    const { goalId } = req.params;
    const { progress, status, title, description, targetDate } = req.body;

    const data = {};
    if (progress !== undefined) {
      data.progress = progress;
      data.status = progress >= 100 ? 'DONE' : progress > 0 ? 'IN_PROGRESS' : 'PENDING';
    }
    if (status) data.status = status;
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (targetDate) data.targetDate = new Date(targetDate);

    const updated = await prisma.pDIGoal.update({ where: { id: goalId }, data });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createPDI,
  listPDIs,
  getPDI,
  updatePDI,
  addGoal,
  updateGoal,
};
