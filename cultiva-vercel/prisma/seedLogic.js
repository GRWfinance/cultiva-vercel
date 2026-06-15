const bcrypt = require('bcryptjs');

// Logica de seed compartilhada entre o script CLI (npm run seed)
// e o endpoint protegido /api/seed (usado em ambientes serverless como Vercel,
// onde nao e possivel rodar scripts arbitrarios apos o deploy).
async function seedDatabase(prisma) {
  console.log('Iniciando seed...');

  // Empresa
  const company = await prisma.company.upsert({
    where: { cnpj: '00000000000100' },
    update: {},
    create: {
      name: 'Cultiva Demo',
      cnpj: '00000000000100',
    },
  });
  console.log('Empresa:', company.name);

  // Departamentos
  const deptNames = ['Diretoria', 'Pessoas & Cultura', 'Tecnologia', 'Comercial', 'Operações'];
  const departments = {};
  for (const name of deptNames) {
    let dept = await prisma.department.findFirst({ where: { name, companyId: company.id } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name, companyId: company.id } });
    }
    departments[name] = dept;
  }
  console.log('Departamentos:', Object.keys(departments).join(', '));

  // Senha padrão para todos os usuários de demo
  const passwordHash = await bcrypt.hash('cultiva123', 10);

  // Usuário admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cultiva.com' },
    update: {},
    create: {
      name: 'Ana Diretora',
      email: 'admin@cultiva.com',
      passwordHash,
      role: 'ADMIN',
      jobTitle: 'CEO',
      hireDate: new Date('2020-01-15'),
      companyId: company.id,
      departmentId: departments['Diretoria'].id,
    },
  });
  console.log('Admin criado:', admin.email, '(senha: cultiva123)');

  // RH
  const hr = await prisma.user.upsert({
    where: { email: 'rh@cultiva.com' },
    update: {},
    create: {
      name: 'Beatriz RH',
      email: 'rh@cultiva.com',
      passwordHash,
      role: 'HR',
      jobTitle: 'Analista de Pessoas',
      hireDate: new Date('2021-03-01'),
      companyId: company.id,
      departmentId: departments['Pessoas & Cultura'].id,
      managerId: admin.id,
    },
  });

  // Gestor
  const manager = await prisma.user.upsert({
    where: { email: 'gestor@cultiva.com' },
    update: {},
    create: {
      name: 'Carlos Gestor',
      email: 'gestor@cultiva.com',
      passwordHash,
      role: 'MANAGER',
      jobTitle: 'Gerente de Tecnologia',
      hireDate: new Date('2021-06-10'),
      companyId: company.id,
      departmentId: departments['Tecnologia'].id,
      managerId: admin.id,
    },
  });

  // Colaboradores
  const employeeData = [
    { name: 'Daniela Costa', email: 'daniela@cultiva.com', jobTitle: 'Desenvolvedora Frontend', dept: 'Tecnologia', hire: '2022-02-01' },
    { name: 'Eduardo Lima', email: 'eduardo@cultiva.com', jobTitle: 'Desenvolvedor Backend', dept: 'Tecnologia', hire: '2022-08-15' },
    { name: 'Fernanda Alves', email: 'fernanda@cultiva.com', jobTitle: 'Designer de Produto', dept: 'Tecnologia', hire: '2023-01-10' },
    { name: 'Gustavo Pereira', email: 'gustavo@cultiva.com', jobTitle: 'Executivo de Vendas', dept: 'Comercial', hire: '2021-11-01' },
    { name: 'Helena Souza', email: 'helena@cultiva.com', jobTitle: 'Analista de Operações', dept: 'Operações', hire: '2023-05-20' },
  ];

  const employees = {};
  for (const e of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        name: e.name,
        email: e.email,
        passwordHash,
        role: 'EMPLOYEE',
        jobTitle: e.jobTitle,
        hireDate: new Date(e.hire),
        companyId: company.id,
        departmentId: departments[e.dept].id,
        managerId: e.dept === 'Tecnologia' ? manager.id : admin.id,
      },
    });
    employees[e.email] = user;
  }
  console.log('Colaboradores criados:', Object.keys(employees).length);

  // ============================================
  // Benefícios
  // ============================================
  const benefitDefs = [
    { name: 'Ticket Cultura', type: 'TICKET_CULTURA', provider: 'Caju', defaultValue: 100, periodicity: 'MONTHLY' },
    { name: 'Ticket Alimentação', type: 'TICKET_ALIMENTACAO', provider: 'Alelo', defaultValue: 600, periodicity: 'MONTHLY' },
    { name: 'Plano de Saúde', type: 'PLANO_SAUDE', provider: 'Unimed', defaultValue: 450, periodicity: 'MONTHLY' },
    { name: 'Gympass', type: 'GYMPASS', provider: 'Gympass', defaultValue: 80, periodicity: 'MONTHLY' },
    { name: 'Auxílio Home Office', type: 'AUXILIO_HOME_OFFICE', provider: 'Interno', defaultValue: 100, periodicity: 'MONTHLY' },
  ];

  const benefits = {};
  for (const b of benefitDefs) {
    let benefit = await prisma.benefit.findFirst({ where: { name: b.name, companyId: company.id } });
    if (!benefit) {
      benefit = await prisma.benefit.create({ data: { ...b, companyId: company.id, active: true } });
    }
    benefits[b.name] = benefit;
  }
  console.log('Benefícios cadastrados:', Object.keys(benefits).length);

  // Conceder benefícios para todos (admin, hr, manager, employees)
  const allUsers = [admin, hr, manager, ...Object.values(employees)];
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (const user of allUsers) {
    for (const benefit of Object.values(benefits)) {
      const existing = await prisma.benefitGrant.findFirst({
        where: { userId: user.id, benefitId: benefit.id, periodStart },
      });
      if (!existing) {
        await prisma.benefitGrant.create({
          data: {
            userId: user.id,
            benefitId: benefit.id,
            value: benefit.defaultValue,
            balance: benefit.defaultValue,
            periodStart,
            periodEnd,
            status: 'ACTIVE',
          },
        });
      }
    }
  }
  console.log('Benefícios concedidos para todos os usuários');

  // ============================================
  // OKRs - ciclo atual
  // ============================================
  const q = Math.floor(now.getMonth() / 3) + 1;
  const cycle = `${now.getFullYear()}-Q${q}`;

  const existingObjective = await prisma.objective.findFirst({ where: { companyId: company.id, cycle } });
  if (!existingObjective) {
    await prisma.objective.create({
      data: {
        companyId: company.id,
        title: 'Ser referência em cultura organizacional',
        description: 'Fortalecer a cultura Cultiva como diferencial competitivo',
        cycle,
        scope: 'COMPANY',
        ownerId: admin.id,
        keyResults: {
          create: [
            { title: 'Aumentar eNPS para 60+', metricType: 'NUMBER', startValue: 35, currentValue: 42, targetValue: 60, unit: '' },
            { title: 'Atingir 90% de adesão ao PDI', metricType: 'PERCENTAGE', startValue: 40, currentValue: 55, targetValue: 90, unit: '%' },
          ],
        },
      },
    });

    await prisma.objective.create({
      data: {
        companyId: company.id,
        title: 'Acelerar entregas de produto',
        description: 'Reduzir o tempo de ciclo de desenvolvimento',
        cycle,
        scope: 'DEPARTMENT',
        departmentId: departments['Tecnologia'].id,
        ownerId: manager.id,
        keyResults: {
          create: [
            { title: 'Reduzir lead time de PRs para 2 dias', metricType: 'NUMBER', startValue: 5, currentValue: 3.5, targetValue: 2, unit: ' dias' },
            { title: 'Aumentar cobertura de testes', metricType: 'PERCENTAGE', startValue: 50, currentValue: 65, targetValue: 85, unit: '%' },
          ],
        },
      },
    });
    console.log('OKRs de exemplo criados para o ciclo', cycle);
  }

  // ============================================
  // Pesquisa de engajamento (ativa)
  // ============================================
  const existingSurvey = await prisma.survey.findFirst({ where: { companyId: company.id, type: 'ENPS' } });
  if (!existingSurvey) {
    await prisma.survey.create({
      data: {
        companyId: company.id,
        creatorId: hr.id,
        title: 'Pesquisa de eNPS - Trimestral',
        description: 'Sua opinião nos ajuda a melhorar o ambiente de trabalho.',
        type: 'ENPS',
        status: 'ACTIVE',
        anonymous: true,
        questions: {
          create: [
            { text: 'Em uma escala de 0 a 10, o quanto você recomendaria a empresa para um amigo trabalhar aqui?', type: 'SCALE', order: 0 },
            { text: 'O que mais te motiva no seu trabalho atualmente?', type: 'TEXT', order: 1 },
          ],
        },
      },
    });
    console.log('Pesquisa de eNPS criada e ativada');
  }

  // ============================================
  // Curso de exemplo
  // ============================================
  const existingCourse = await prisma.course.findFirst({ where: { companyId: company.id } });
  if (!existingCourse) {
    await prisma.course.create({
      data: {
        companyId: company.id,
        creatorId: hr.id,
        title: 'Onboarding Cultiva',
        description: 'Conheça a cultura, valores e ferramentas da empresa.',
        category: 'Onboarding',
        durationMin: 90,
        level: 'BEGINNER',
        active: true,
        modules: {
          create: [
            { title: 'Bem-vindo à Cultiva', order: 0, durationMin: 20 },
            { title: 'Nossos valores e cultura', order: 1, durationMin: 30 },
            { title: 'Ferramentas do dia a dia', order: 2, durationMin: 40 },
          ],
        },
      },
    });
    console.log('Curso de Onboarding criado');
  }

  console.log('\n=== Seed concluído ===');
  console.log('Login de administrador: admin@cultiva.com / cultiva123');
  console.log('Login de RH: rh@cultiva.com / cultiva123');
  console.log('Login de gestor: gestor@cultiva.com / cultiva123');
  console.log('Demais colaboradores: <nome>@cultiva.com / cultiva123');

  return { success: true };
}

module.exports = { seedDatabase };
