const prisma = require('../config/prisma');
const { seedDatabase } = require('../../../prisma/seedLogic');

// Endpoint protegido para popular o banco com dados iniciais (empresa, usuários
// de demonstração, benefícios, OKRs, etc). Necessário em ambientes serverless
// (Vercel) onde não é possível rodar `npm run seed` após o deploy.
//
// Proteção: requer header `x-seed-secret` igual à variável de ambiente SEED_SECRET.
async function runSeed(req, res) {
  try {
    const secret = req.headers['x-seed-secret'];
    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      return res.status(401).json({ error: 'Não autorizado. Defina SEED_SECRET e envie o header x-seed-secret.' });
    }

    const result = await seedDatabase(prisma);
    res.json({ message: 'Seed executado com sucesso.', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { runSeed };
