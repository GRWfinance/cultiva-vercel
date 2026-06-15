const prisma = require('../config/prisma');

// Criar/atualizar posição de um colaborador na matriz 9-box
async function upsertEntry(req, res) {
  try {
    const { employeeId, cycle, performance, potential, notes } = req.body;

    const existing = await prisma.successionEntry.findFirst({
      where: { employeeId, cycle, companyId: req.user.companyId },
    });

    let entry;
    if (existing) {
      entry = await prisma.successionEntry.update({
        where: { id: existing.id },
        data: { performance, potential, notes },
      });
    } else {
      entry = await prisma.successionEntry.create({
        data: {
          companyId: req.user.companyId,
          employeeId,
          cycle,
          performance,
          potential,
          notes,
        },
      });
    }

    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar matriz 9-box de um ciclo
async function getMatrix(req, res) {
  try {
    const { cycle } = req.query;
    if (!cycle) return res.status(400).json({ error: 'Parâmetro cycle é obrigatório' });

    const entries = await prisma.successionEntry.findMany({
      where: { companyId: req.user.companyId, cycle },
      include: {
        employee: { select: { id: true, name: true, jobTitle: true, departmentId: true, department: { select: { name: true } } } },
        candidates: { include: { candidate: { select: { id: true, name: true } } } },
      },
    });

    // Organiza em grid 3x3 (performance x potential, ambos 1-3)
    const grid = {};
    for (let p = 1; p <= 3; p++) {
      for (let q = 1; q <= 3; q++) {
        grid[`${p}-${q}`] = [];
      }
    }

    for (const e of entries) {
      const key = `${e.performance}-${e.potential}`;
      if (grid[key]) grid[key].push(e);
    }

    res.json({ cycle, grid, totalEntries: entries.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar candidato a sucessor para uma posição crítica
async function addCandidate(req, res) {
  try {
    const { successionEntryId, positionTitle, candidateId, readiness, notes } = req.body;

    const candidate = await prisma.successionCandidate.create({
      data: {
        successionEntryId,
        positionTitle,
        candidateId,
        readiness: readiness || 'DEVELOPING',
        notes,
      },
      include: { candidate: { select: { id: true, name: true } } },
    });

    res.status(201).json(candidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Lista posições críticas e seus candidatos (visão por posição)
async function listCriticalPositions(req, res) {
  try {
    const candidates = await prisma.successionCandidate.findMany({
      where: { successionEntry: { companyId: req.user.companyId } },
      include: {
        candidate: { select: { id: true, name: true, jobTitle: true } },
        successionEntry: { select: { cycle: true } },
      },
    });

    const byPosition = {};
    for (const c of candidates) {
      if (!byPosition[c.positionTitle]) byPosition[c.positionTitle] = [];
      byPosition[c.positionTitle].push({
        candidate: c.candidate,
        readiness: c.readiness,
        notes: c.notes,
        cycle: c.successionEntry.cycle,
      });
    }

    res.json(byPosition);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  upsertEntry,
  getMatrix,
  addCandidate,
  listCriticalPositions,
};
