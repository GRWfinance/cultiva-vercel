const prisma = require('../config/prisma');

// ============================================
// CATÁLOGO DE BENEFÍCIOS (Admin/HR)
// ============================================

// Criar um novo benefício no catálogo da empresa
async function createBenefit(req, res) {
  try {
    const { name, description, type, provider, defaultValue, periodicity, eligibilityRules } = req.body;

    const benefit = await prisma.benefit.create({
      data: {
        companyId: req.user.companyId,
        name,
        description,
        type,
        provider,
        defaultValue,
        periodicity: periodicity || 'MONTHLY',
        eligibilityRules: eligibilityRules
          ? {
              create: eligibilityRules.map(rule => ({
                departmentId: rule.departmentId || null,
                minTenureMonths: rule.minTenureMonths || null,
                jobTitlePattern: rule.jobTitlePattern || null,
                role: rule.role || null,
              })),
            }
          : undefined,
      },
      include: { eligibilityRules: true },
    });

    res.status(201).json(benefit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar catálogo de benefícios da empresa
async function listBenefits(req, res) {
  try {
    const { active } = req.query;
    const where = { companyId: req.user.companyId };
    if (active !== undefined) where.active = active === 'true';

    const benefits = await prisma.benefit.findMany({
      where,
      include: { eligibilityRules: true },
      orderBy: { name: 'asc' },
    });

    res.json(benefits);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Detalhe de um benefício
async function getBenefit(req, res) {
  try {
    const { id } = req.params;

    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: { eligibilityRules: true },
    });

    if (!benefit) return res.status(404).json({ error: 'Benefício não encontrado' });
    res.json(benefit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Atualizar benefício (valor padrão, status ativo, descrição etc)
async function updateBenefit(req, res) {
  try {
    const { id } = req.params;
    const { name, description, provider, defaultValue, periodicity, active } = req.body;

    const updated = await prisma.benefit.update({
      where: { id },
      data: { name, description, provider, defaultValue, periodicity, active },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Adicionar regra de elegibilidade a um benefício existente
async function addEligibilityRule(req, res) {
  try {
    const { id } = req.params; // benefitId
    const { departmentId, minTenureMonths, jobTitlePattern, role } = req.body;

    const rule = await prisma.eligibilityRule.create({
      data: {
        benefitId: id,
        departmentId: departmentId || null,
        minTenureMonths: minTenureMonths || null,
        jobTitlePattern: jobTitlePattern || null,
        role: role || null,
      },
    });

    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createBenefit,
  listBenefits,
  getBenefit,
  updateBenefit,
  addEligibilityRule,
};
