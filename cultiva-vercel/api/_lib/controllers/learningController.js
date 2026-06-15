const prisma = require('../config/prisma');

// Criar curso (com módulos)
async function createCourse(req, res) {
  try {
    const { title, description, category, durationMin, level, modules } = req.body;

    const course = await prisma.course.create({
      data: {
        companyId: req.user.companyId,
        creatorId: req.user.id,
        title,
        description,
        category,
        durationMin,
        level: level || 'BEGINNER',
        modules: modules
          ? {
              create: modules.map((m, idx) => ({
                title: m.title,
                order: idx,
                durationMin: m.durationMin || null,
              })),
            }
          : undefined,
      },
      include: { modules: true },
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Catálogo de cursos
async function listCourses(req, res) {
  try {
    const { category, active } = req.query;
    const where = { companyId: req.user.companyId };
    if (category) where.category = category;
    if (active !== undefined) where.active = active === 'true';

    const courses = await prisma.course.findMany({
      where,
      include: { modules: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses.map(c => ({ ...c, enrollmentsCount: c._count.enrollments, _count: undefined })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Detalhe de curso (com progresso do usuário se inscrito)
async function getCourse(req, res) {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: { orderBy: { order: 'asc' } },
        enrollments: { where: { userId: req.user.id }, include: { moduleCompletions: true } },
      },
    });

    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    const myEnrollment = course.enrollments[0] || null;
    res.json({ ...course, enrollments: undefined, myEnrollment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Inscrever-se em um curso
async function enroll(req, res) {
  try {
    const { id } = req.params; // courseId

    const existing = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: id, userId: req.user.id } },
    });
    if (existing) return res.status(409).json({ error: 'Já inscrito neste curso' });

    const enrollment = await prisma.enrollment.create({
      data: { courseId: id, userId: req.user.id, status: 'IN_PROGRESS' },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Marcar módulo como concluído
async function completeModule(req, res) {
  try {
    const { moduleId } = req.params;

    const module_ = await prisma.courseModule.findUnique({ where: { id: moduleId }, include: { course: { include: { modules: true } } } });
    if (!module_) return res.status(404).json({ error: 'Módulo não encontrado' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: module_.courseId, userId: req.user.id } },
    });
    if (!enrollment) return res.status(404).json({ error: 'Você não está inscrito neste curso' });

    // Evita duplicar
    const existingCompletion = await prisma.moduleCompletion.findUnique({
      where: { moduleId_enrollmentId: { moduleId, enrollmentId: enrollment.id } },
    });
    if (existingCompletion) return res.json({ message: 'Módulo já concluído', enrollment });

    await prisma.moduleCompletion.create({ data: { moduleId, enrollmentId: enrollment.id } });

    const totalModules = module_.course.modules.length;
    const completedCount = await prisma.moduleCompletion.count({ where: { enrollmentId: enrollment.id } });
    const progress = Math.round((completedCount / totalModules) * 100);

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress,
        status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Minhas trilhas (inscrições)
async function listMyEnrollments(req, res) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: { course: { select: { id: true, title: true, category: true, level: true, durationMin: true } } },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json(enrollments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createCourse,
  listCourses,
  getCourse,
  enroll,
  completeModule,
  listMyEnrollments,
};
