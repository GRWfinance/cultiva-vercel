const prisma = require('../config/prisma');

// ============================================
// SOLICITAÇÕES DE BENEFÍCIOS (workflow de aprovação)
// ============================================

// Colaborador cria uma solicitação (novo benefício, troca de plano, reembolso, cancelamento)
async function createBenefitRequest(req, res) {
  try {
    const { type, description, benefitId } = req.body;

    const request = await prisma.benefitRequest.create({
      data: {
        userId: req.user.id,
        type,
        description,
        benefitId: benefitId || null,
      },
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar solicitações do usuário logado
async function listMyRequests(req, res) {
  try {
    const requests = await prisma.benefitRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Listar todas as solicitações pendentes (RH/Admin)
async function listPendingRequests(req, res) {
  try {
    const { status } = req.query;

    const requests = await prisma.benefitRequest.findMany({
      where: { status: status || 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, departmentId: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(requests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Aprovar ou rejeitar solicitação (RH/Admin)
async function reviewRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body; // status: APPROVED | REJECTED

    const updated = await prisma.benefitRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ============================================
// ANALYTICS / ORÇAMENTO DE BENEFÍCIOS
// ============================================

// Definir/atualizar orçamento planejado (anual ou mensal) por benefício
async function setBudget(req, res) {
  try {
    const { benefitId, year, month, plannedAmount } = req.body;

    const budget = await prisma.benefitBudget.upsert({
      where: {
        // como não há unique composto definido no schema, usamos findFirst + create/update manual
        id: req.body.budgetId || '00000000-0000-0000-0000-000000000000',
      },
      update: { plannedAmount },
      create: {
        companyId: req.user.companyId,
        benefitId: benefitId || null,
        year,
        month: month || null,
        plannedAmount,
      },
    }).catch(async () => {
      // fallback: cria novo se upsert por id fixo falhar (registro não existe)
      return prisma.benefitBudget.create({
        data: {
          companyId: req.user.companyId,
          benefitId: benefitId || null,
          year,
          month: month || null,
          plannedAmount,
        },
      });
    });

    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Relatório de custos: total gasto por benefício em um período
async function getCostReport(req, res) {
  try {
    const { year, month } = req.query;
    const companyId = req.user.companyId;

    // Busca todas as transações de DEBIT/CREDIT de grants de benefícios da empresa no período
    const dateFilter = {};
    if (year) {
      const y = parseInt(year);
      const m = month ? parseInt(month) : null;
      if (m) {
        dateFilter.gte = new Date(y, m - 1, 1);
        dateFilter.lt = new Date(y, m, 1);
      } else {
        dateFilter.gte = new Date(y, 0, 1);
        dateFilter.lt = new Date(y + 1, 0, 1);
      }
    }

    const benefits = await prisma.benefit.findMany({
      where: { companyId },
      include: {
        grants: {
          where: dateFilter.gte ? { createdAt: dateFilter } : undefined,
          include: { transactions: true },
        },
        budgets: year
          ? { where: { year: parseInt(year), month: month ? parseInt(month) : null } }
          : true,
      },
    });

    const report = benefits.map(b => {
      const totalGranted = b.grants.reduce((sum, g) => sum + parseFloat(g.value), 0);
      const totalSpent = b.grants.reduce((sum, g) => {
        const debits = g.transactions
          .filter(t => t.type === 'DEBIT')
          .reduce((s, t) => s + parseFloat(t.amount), 0);
        return sum + debits;
      }, 0);
      const planned = b.budgets.reduce((sum, bud) => sum + parseFloat(bud.plannedAmount), 0);

      return {
        benefitId: b.id,
        benefitName: b.name,
        type: b.type,
        beneficiariesCount: b.grants.length,
        totalGranted,
        totalSpent,
        plannedBudget: planned,
        variance: planned - totalGranted,
      };
    });

    const totals = report.reduce(
      (acc, r) => ({
        totalGranted: acc.totalGranted + r.totalGranted,
        totalSpent: acc.totalSpent + r.totalSpent,
        plannedBudget: acc.plannedBudget + r.plannedBudget,
      }),
      { totalGranted: 0, totalSpent: 0, plannedBudget: 0 }
    );

    res.json({ period: { year, month }, byBenefit: report, totals });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Relatório de custos por departamento
async function getCostByDepartment(req, res) {
  try {
    const companyId = req.user.companyId;

    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        users: {
          include: {
            benefitGrants: { include: { benefit: true } },
          },
        },
      },
    });

    const report = departments.map(dept => {
      let total = 0;
      const byBenefit = {};

      for (const user of dept.users) {
        for (const grant of user.benefitGrants) {
          const value = parseFloat(grant.value);
          total += value;
          byBenefit[grant.benefit.name] = (byBenefit[grant.benefit.name] || 0) + value;
        }
      }

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        headcount: dept.users.length,
        totalBenefitsCost: total,
        byBenefit,
      };
    });

    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createBenefitRequest,
  listMyRequests,
  listPendingRequests,
  reviewRequest,
  setBudget,
  getCostReport,
  getCostByDepartment,
};
