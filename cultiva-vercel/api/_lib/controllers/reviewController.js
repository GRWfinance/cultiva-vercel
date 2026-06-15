const prisma = require('../config/prisma');

// ============================================
// CICLOS DE AVALIAÇÃO (Admin/HR)
// ============================================

// Criar ciclo de avaliação
async function createCycle(req, res) {
  try {
    const { name, startDate, endDate, reviewTypes } = req.body;

    const cycle = await prisma.reviewCycle.create({
      data: {
        companyId: req.user.companyId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reviewTypes: reviewTypes || ['SELF', 'MANAGER'],
      },
    });

    res.status(201).json(cycle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar ciclos
async function listCycles(req, res) {
  try {
    const cycles = await prisma.reviewCycle.findMany({
      where: { companyId: req.user.companyId },
      include: { participants: { select: { id: true } } },
      orderBy: { startDate: 'desc' },
    });

    res.json(cycles.map(c => ({ ...c, participantsCount: c.participants.length, participants: undefined })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Abrir ciclo: gera participantes + reviews para todos os colaboradores ativos
async function openCycle(req, res) {
  try {
    const { id } = req.params;

    const cycle = await prisma.reviewCycle.findUnique({ where: { id } });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });

    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId, active: true },
    });

    let createdParticipants = 0;

    for (const user of users) {
      const existing = await prisma.reviewParticipant.findFirst({ where: { cycleId: id, subjectId: user.id } });
      if (existing) continue;

      const reviewsToCreate = [];

      if (cycle.reviewTypes.includes('SELF')) {
        reviewsToCreate.push({ type: 'SELF', authorId: user.id });
      }
      if (cycle.reviewTypes.includes('MANAGER') && user.managerId) {
        reviewsToCreate.push({ type: 'MANAGER', authorId: user.managerId });
      }
      if (cycle.reviewTypes.includes('UPWARD') && user.managerId) {
        // o próprio usuário avalia o gestor (upward) - cria participante separado para o gestor
      }

      await prisma.reviewParticipant.create({
        data: {
          cycleId: id,
          subjectId: user.id,
          reviews: { create: reviewsToCreate },
        },
      });
      createdParticipants++;
    }

    const updated = await prisma.reviewCycle.update({ where: { id }, data: { status: 'OPEN' } });

    res.json({ cycle: updated, participantsCreated: createdParticipants });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Fechar ciclo (calcula overallScore de cada participante)
async function closeCycle(req, res) {
  try {
    const { id } = req.params;

    const participants = await prisma.reviewParticipant.findMany({
      where: { cycleId: id },
      include: { reviews: { include: { answers: true } } },
    });

    for (const p of participants) {
      const allScores = p.reviews
        .filter(r => r.status === 'SUBMITTED')
        .flatMap(r => r.answers.map(a => a.score));

      const overallScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

      await prisma.reviewParticipant.update({
        where: { id: p.id },
        data: { overallScore, completedAt: new Date() },
      });
    }

    const updated = await prisma.reviewCycle.update({ where: { id }, data: { status: 'CLOSED' } });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ============================================
// PARTICIPANTES E AVALIAÇÕES
// ============================================

// Lista as avaliações pendentes/em andamento do usuário logado (como autor)
async function listMyReviews(req, res) {
  try {
    const { status, cycleId } = req.query;

    const where = { authorId: req.user.id };
    if (status) where.status = status;
    if (cycleId) where.participant = { cycleId };

    const reviews = await prisma.review.findMany({
      where,
      include: {
        participant: {
          include: {
            subject: { select: { id: true, name: true, jobTitle: true } },
            cycle: { select: { id: true, name: true, status: true } },
          },
        },
        answers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Detalhe de uma avaliação específica (para preencher)
async function getReview(req, res) {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        participant: { include: { subject: { select: { id: true, name: true, jobTitle: true } } } },
        answers: true,
      },
    });

    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });
    if (review.authorId !== req.user.id && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Salvar respostas (rascunho ou envio final)
async function submitReview(req, res) {
  try {
    const { id } = req.params;
    const { answers, overallComment, submit } = req.body; // answers: [{ competency, score, comment }]

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });
    if (review.authorId !== req.user.id) return res.status(403).json({ error: 'Acesso não autorizado' });

    // Remove respostas anteriores e recria (simplifica update de múltiplas competências)
    await prisma.reviewAnswer.deleteMany({ where: { reviewId: id } });

    const updated = await prisma.review.update({
      where: { id },
      data: {
        overallComment,
        status: submit ? 'SUBMITTED' : 'IN_PROGRESS',
        submittedAt: submit ? new Date() : null,
        answers: {
          create: answers.map(a => ({ competency: a.competency, score: a.score, comment: a.comment || null })),
        },
      },
      include: { answers: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Resultado consolidado de um colaborador em um ciclo (visão 360°)
async function getParticipantResults(req, res) {
  try {
    const { id } = req.params; // participantId

    const participant = await prisma.reviewParticipant.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, jobTitle: true } },
        cycle: { select: { id: true, name: true } },
        reviews: {
          where: { status: 'SUBMITTED' },
          include: { answers: true, author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!participant) return res.status(404).json({ error: 'Participante não encontrado' });

    // Verifica permissão: próprio usuário, gestor, ou HR/Admin
    const isSelf = participant.subjectId === req.user.id;
    const isHR = ['ADMIN', 'HR'].includes(req.user.role);
    if (!isSelf && !isHR) {
      const subject = await prisma.user.findUnique({ where: { id: participant.subjectId } });
      if (subject?.managerId !== req.user.id) return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Agrega scores por competência e por tipo de avaliador
    const byCompetency = {};
    for (const review of participant.reviews) {
      for (const ans of review.answers) {
        if (!byCompetency[ans.competency]) byCompetency[ans.competency] = {};
        byCompetency[ans.competency][review.type] = ans.score;
      }
    }

    res.json({
      subject: participant.subject,
      cycle: participant.cycle,
      overallScore: participant.overallScore,
      byCompetency,
      reviews: participant.reviews.map(r => ({
        type: r.type,
        author: r.type === 'SELF' ? null : r.author, // anonimiza peer/upward se necessário
        overallComment: r.overallComment,
        answers: r.answers,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createCycle,
  listCycles,
  openCycle,
  closeCycle,
  listMyReviews,
  getReview,
  submitReview,
  getParticipantResults,
};
