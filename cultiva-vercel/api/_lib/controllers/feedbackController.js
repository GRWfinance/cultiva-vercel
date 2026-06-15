const prisma = require('../config/prisma');

// Enviar feedback
async function createFeedback(req, res) {
  try {
    const { receiverId, content, type, visibility, competencies, isAnonymous } = req.body;

    const data = {
      receiverId,
      content,
      type,
      visibility: visibility || 'PRIVATE',
      competencies: competencies || [],
      isAnonymous: !!isAnonymous,
    };

    // Se anônimo, não grava o remetente
    if (!isAnonymous) data.senderId = req.user.id;

    const feedback = await prisma.feedback.create({ data });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar feedbacks recebidos
async function listReceivedFeedbacks(req, res) {
  try {
    const { type } = req.query;
    const where = { receiverId: req.user.id };
    if (type) where.type = type;

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } }, // null se anônimo
      },
      orderBy: { createdAt: 'desc' },
    });

    // Oculta dados do remetente se anônimo
    const sanitized = feedbacks.map(f => ({
      ...f,
      sender: f.isAnonymous ? null : f.sender,
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar feedbacks enviados
async function listSentFeedbacks(req, res) {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { senderId: req.user.id },
      include: { receiver: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedbacks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Feedbacks de um colaborador (visão do gestor) - respeita visibilidade
async function listFeedbacksForEmployee(req, res) {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Verifica se o requester é o próprio usuário, gestor dele, ou HR/ADMIN
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });

    const isSelf = requesterId === userId;
    const isManager = target.managerId === requesterId;
    const isHR = ['HR', 'ADMIN'].includes(requesterRole);

    if (!isSelf && !isManager && !isHR) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const visibilityFilter = isSelf
      ? {} // próprio usuário vê tudo que recebeu
      : { visibility: { in: ['MANAGER', 'PUBLIC'] } }; // gestor/HR só vê MANAGER+PUBLIC

    const feedbacks = await prisma.feedback.findMany({
      where: { receiverId: userId, ...visibilityFilter },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = feedbacks.map(f => ({
      ...f,
      sender: f.isAnonymous ? null : f.sender,
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Mural público de feedbacks
async function listPublicFeedbacks(req, res) {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const sanitized = feedbacks.map(f => ({
      ...f,
      sender: f.isAnonymous ? null : f.sender,
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createFeedback,
  listReceivedFeedbacks,
  listSentFeedbacks,
  listFeedbacksForEmployee,
  listPublicFeedbacks,
};
