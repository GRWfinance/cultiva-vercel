const prisma = require('../config/prisma');

// ============================================
// CONCESSÃO DE BENEFÍCIOS (Grants) - Wallet do colaborador
// ============================================

// Verifica se um usuário é elegível para um benefício, com base nas regras cadastradas
async function checkEligibility(user, benefit) {
  const rules = benefit.eligibilityRules;

  // Sem regras = elegível para todos
  if (!rules || rules.length === 0) return true;

  // Usuário precisa atender a PELO MENOS UMA regra (OR entre regras)
  for (const rule of rules) {
    let matches = true;

    if (rule.departmentId && user.departmentId !== rule.departmentId) matches = false;

    if (rule.role && user.role !== rule.role) matches = false;

    if (rule.minTenureMonths != null) {
      if (!user.hireDate) {
        matches = false;
      } else {
        const months =
          (Date.now() - new Date(user.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (months < rule.minTenureMonths) matches = false;
      }
    }

    if (rule.jobTitlePattern && user.jobTitle) {
      const regex = new RegExp(rule.jobTitlePattern, 'i');
      if (!regex.test(user.jobTitle)) matches = false;
    }

    if (matches) return true;
  }

  return false;
}

// Calcula início/fim do período de concessão com base na periodicidade
function getPeriodRange(periodicity, referenceDate = new Date()) {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (periodicity) {
    case 'MONTHLY':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'QUARTERLY': {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'YEARLY':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'ONE_TIME':
      // sem expiração definida automaticamente - usar data distante
      end.setFullYear(end.getFullYear() + 10);
      break;
  }

  return { start, end };
}

// Conceder benefício a um colaborador específico (cria grant + transação de crédito)
async function grantBenefit(req, res) {
  try {
    const { benefitId, userId, value, periodStart, periodEnd } = req.body;

    const benefit = await prisma.benefit.findUnique({ where: { id: benefitId } });
    if (!benefit) return res.status(404).json({ error: 'Benefício não encontrado' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const grantValue = value != null ? value : benefit.defaultValue;

    let start, end;
    if (periodStart && periodEnd) {
      start = new Date(periodStart);
      end = new Date(periodEnd);
    } else {
      const range = getPeriodRange(benefit.periodicity);
      start = range.start;
      end = range.end;
    }

    const result = await prisma.$transaction(async tx => {
      const grant = await tx.benefitGrant.create({
        data: {
          benefitId,
          userId,
          value: grantValue,
          balance: grantValue,
          periodStart: start,
          periodEnd: end,
        },
      });

      await tx.benefitTransaction.create({
        data: {
          grantId: grant.id,
          userId,
          amount: grantValue,
          type: 'CREDIT',
          description: `Concessão de ${benefit.name} - período ${start.toISOString().slice(0, 10)} a ${end.toISOString().slice(0, 10)}`,
        },
      });

      return grant;
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Concessão em massa - para todos os elegíveis de um benefício (rotina mensal)
async function bulkGrantBenefit(req, res) {
  try {
    const { benefitId } = req.body;

    const benefit = await prisma.benefit.findUnique({
      where: { id: benefitId },
      include: { eligibilityRules: true },
    });
    if (!benefit) return res.status(404).json({ error: 'Benefício não encontrado' });

    const users = await prisma.user.findMany({
      where: { companyId: benefit.companyId, active: true },
    });

    const { start, end } = getPeriodRange(benefit.periodicity);
    const created = [];
    const skipped = [];

    for (const user of users) {
      const eligible = await checkEligibility(user, benefit);
      if (!eligible) {
        skipped.push(user.id);
        continue;
      }

      // Evita duplicar grant no mesmo período
      const existing = await prisma.benefitGrant.findFirst({
        where: {
          benefitId,
          userId: user.id,
          periodStart: start,
          periodEnd: end,
        },
      });
      if (existing) {
        skipped.push(user.id);
        continue;
      }

      const result = await prisma.$transaction(async tx => {
        const grant = await tx.benefitGrant.create({
          data: {
            benefitId,
            userId: user.id,
            value: benefit.defaultValue,
            balance: benefit.defaultValue,
            periodStart: start,
            periodEnd: end,
          },
        });

        await tx.benefitTransaction.create({
          data: {
            grantId: grant.id,
            userId: user.id,
            amount: benefit.defaultValue,
            type: 'CREDIT',
            description: `Concessão automática de ${benefit.name}`,
          },
        });

        return grant;
      });

      created.push(result);
    }

    res.status(201).json({
      benefit: benefit.name,
      period: { start, end },
      grantedCount: created.length,
      skippedCount: skipped.length,
      grants: created,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Wallet do colaborador logado - todos os saldos ativos
async function getMyWallet(req, res) {
  try {
    const userId = req.user.id;

    const grants = await prisma.benefitGrant.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { benefit: true },
      orderBy: { periodEnd: 'asc' },
    });

    const wallet = grants.map(g => ({
      grantId: g.id,
      benefit: g.benefit.name,
      type: g.benefit.type,
      provider: g.benefit.provider,
      value: g.value,
      balance: g.balance,
      periodStart: g.periodStart,
      periodEnd: g.periodEnd,
    }));

    const totalBalance = grants.reduce((sum, g) => sum + parseFloat(g.balance), 0);

    res.json({ totalBalance, items: wallet });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Wallet de um colaborador específico (visão RH/Admin/Gestor)
async function getUserWallet(req, res) {
  try {
    const { userId } = req.params;

    const grants = await prisma.benefitGrant.findMany({
      where: { userId },
      include: { benefit: true, transactions: { orderBy: { createdAt: 'desc' } } },
      orderBy: { periodEnd: 'desc' },
    });

    res.json(grants);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Registrar uso/débito de saldo (ex: integração com operadora confirmando uma compra)
async function debitBenefit(req, res) {
  try {
    const { grantId } = req.params;
    const { amount, description } = req.body;

    const grant = await prisma.benefitGrant.findUnique({ where: { id: grantId } });
    if (!grant) return res.status(404).json({ error: 'Concessão não encontrada' });

    if (parseFloat(grant.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const result = await prisma.$transaction(async tx => {
      const updated = await tx.benefitGrant.update({
        where: { id: grantId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.benefitTransaction.create({
        data: {
          grantId,
          userId: grant.userId,
          amount,
          type: 'DEBIT',
          description: description || 'Uso de benefício',
        },
      });

      return { grant: updated, transaction };
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Ajuste manual de saldo (RH) - pode ser positivo ou negativo
async function adjustBenefitBalance(req, res) {
  try {
    const { grantId } = req.params;
    const { amount, description } = req.body; // amount pode ser negativo

    const grant = await prisma.benefitGrant.findUnique({ where: { id: grantId } });
    if (!grant) return res.status(404).json({ error: 'Concessão não encontrada' });

    const result = await prisma.$transaction(async tx => {
      const updated = await tx.benefitGrant.update({
        where: { id: grantId },
        data: { balance: { increment: amount }, value: amount > 0 ? { increment: amount } : undefined },
      });

      const transaction = await tx.benefitTransaction.create({
        data: {
          grantId,
          userId: grant.userId,
          amount: Math.abs(amount),
          type: 'ADJUSTMENT',
          description: description || 'Ajuste manual de RH',
        },
      });

      return { grant: updated, transaction };
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  grantBenefit,
  bulkGrantBenefit,
  getMyWallet,
  getUserWallet,
  debitBenefit,
  adjustBenefitBalance,
  checkEligibility,
  getPeriodRange,
};
