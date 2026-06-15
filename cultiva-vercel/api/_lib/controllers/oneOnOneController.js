const prisma = require('../config/prisma');

// Criar/agendar um 1:1
async function createOneOnOne(req, res) {
  try {
    const { employeeId, managerId, scheduledAt, durationMin, location } = req.body;

    const oneOnOne = await prisma.oneOnOne.create({
      data: {
        employeeId,
        managerId,
        scheduledAt: new Date(scheduledAt),
        durationMin: durationMin || 30,
        location,
      },
    });

    res.status(201).json(oneOnOne);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar 1:1s do usuário logado (como employee ou manager)
async function listOneOnOnes(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = {
      OR: [{ employeeId: userId }, { managerId: userId }],
    };
    if (status) where.status = status;

    const oneOnOnes = await prisma.oneOnOne.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        topics: { orderBy: { order: 'asc' } },
        actionItems: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json(oneOnOnes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Detalhe de um 1:1
async function getOneOnOne(req, res) {
  try {
    const { id } = req.params;

    const oneOnOne = await prisma.oneOnOne.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        topics: { orderBy: { order: 'asc' } },
        notes: true,
        actionItems: { include: { owner: { select: { id: true, name: true } } } },
      },
    });

    if (!oneOnOne) return res.status(404).json({ error: '1:1 não encontrado' });

    // Filtra topics e notes privados que não pertencem ao usuário
    const userId = req.user.id;
    oneOnOne.topics = oneOnOne.topics.filter(t => !t.isPrivate || t.addedBy === userId);
    oneOnOne.notes = oneOnOne.notes.filter(n => !n.isPrivate || n.authorId === userId);

    res.json(oneOnOne);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar status (concluir, cancelar, reagendar)
async function updateOneOnOneStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, scheduledAt } = req.body;

    const data = {};
    if (status) data.status = status;
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);

    const updated = await prisma.oneOnOne.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar item à pauta (topic)
async function addTopic(req, res) {
  try {
    const { id } = req.params; // oneOnOneId
    const { title, description, isPrivate, order } = req.body;

    const topic = await prisma.oneOnOneTopic.create({
      data: {
        oneOnOneId: id,
        title,
        description,
        isPrivate: !!isPrivate,
        order: order || 0,
        addedBy: req.user.id,
      },
    });

    res.status(201).json(topic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar nota à reunião
async function addNote(req, res) {
  try {
    const { id } = req.params; // oneOnOneId
    const { content, isPrivate } = req.body;

    const note = await prisma.oneOnOneNote.create({
      data: {
        oneOnOneId: id,
        content,
        isPrivate: !!isPrivate,
        authorId: req.user.id,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Criar action item (próximo passo)
async function createActionItem(req, res) {
  try {
    const { id } = req.params; // oneOnOneId (opcional - pode vir null)
    const { description, dueDate, ownerId } = req.body;

    const actionItem = await prisma.actionItem.create({
      data: {
        oneOnOneId: id || null,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: ownerId || req.user.id,
      },
    });

    res.status(201).json(actionItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar status do action item
async function updateActionItemStatus(req, res) {
  try {
    const { itemId } = req.params;
    const { status } = req.body;

    const updated = await prisma.actionItem.update({
      where: { id: itemId },
      data: { status },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar action items pendentes do usuário (cross 1:1s)
async function listMyActionItems(req, res) {
  try {
    const { status } = req.query;
    const where = { ownerId: req.user.id };
    if (status) where.status = status;

    const items = await prisma.actionItem.findMany({
      where,
      include: { oneOnOne: { select: { id: true, scheduledAt: true } } },
      orderBy: { dueDate: 'asc' },
    });

    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createOneOnOne,
  listOneOnOnes,
  getOneOnOne,
  updateOneOnOneStatus,
  addTopic,
  addNote,
  createActionItem,
  updateActionItemStatus,
  listMyActionItems,
};
