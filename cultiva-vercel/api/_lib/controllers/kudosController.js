const prisma = require('../config/prisma');

// Enviar elogio
async function createKudos(req, res) {
  try {
    const { receiverId, message, values } = req.body;

    const kudos = await prisma.kudos.create({
      data: {
        senderId: req.user.id,
        receiverId,
        message,
        values: values || [],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(kudos);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Mural de elogios (toda a empresa)
async function listKudos(req, res) {
  try {
    const { userId } = req.query; // filtra por destinatário se informado

    const where = {};
    if (userId) where.receiverId = userId;

    const kudos = await prisma.kudos.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(kudos);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Curtir elogio
async function likeKudos(req, res) {
  try {
    const { id } = req.params;

    const updated = await prisma.kudos.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Ranking de valores mais reconhecidos (analytics simples)
async function getKudosStats(req, res) {
  try {
    const kudos = await prisma.kudos.findMany({ select: { values: true, receiverId: true, receiver: { select: { name: true } } } });

    const valueCounts = {};
    const receiverCounts = {};

    for (const k of kudos) {
      for (const v of k.values) {
        valueCounts[v] = (valueCounts[v] || 0) + 1;
      }
      const key = k.receiver.name;
      receiverCounts[key] = (receiverCounts[key] || 0) + 1;
    }

    const topValues = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count }));
    const topReceivers = Object.entries(receiverCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    res.json({ totalKudos: kudos.length, topValues, topReceivers });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createKudos,
  listKudos,
  likeKudos,
  getKudosStats,
};
