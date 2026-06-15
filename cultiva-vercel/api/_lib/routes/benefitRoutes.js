const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const benefitCtrl = require('../controllers/benefitController');
const grantCtrl = require('../controllers/benefitGrantController');
const analyticsCtrl = require('../controllers/benefitAnalyticsController');

router.use(authenticate);

// ---------- Catálogo de Benefícios (Admin/HR) ----------
router.post('/', authorize('ADMIN', 'HR'), benefitCtrl.createBenefit);
router.get('/', benefitCtrl.listBenefits); // todos podem ver o catálogo
router.get('/:id', benefitCtrl.getBenefit);
router.patch('/:id', authorize('ADMIN', 'HR'), benefitCtrl.updateBenefit);
router.post('/:id/eligibility-rules', authorize('ADMIN', 'HR'), benefitCtrl.addEligibilityRule);

// ---------- Concessões (Grants) / Wallet ----------
router.post('/grants', authorize('ADMIN', 'HR'), grantCtrl.grantBenefit);
router.post('/grants/bulk', authorize('ADMIN', 'HR'), grantCtrl.bulkGrantBenefit);
router.get('/wallet/me', grantCtrl.getMyWallet);
router.get('/wallet/:userId', authorize('ADMIN', 'HR', 'MANAGER'), grantCtrl.getUserWallet);
router.post('/grants/:grantId/debit', authorize('ADMIN', 'HR'), grantCtrl.debitBenefit);
router.post('/grants/:grantId/adjust', authorize('ADMIN', 'HR'), grantCtrl.adjustBenefitBalance);

// ---------- Solicitações (workflow de aprovação) ----------
router.post('/requests', analyticsCtrl.createBenefitRequest);
router.get('/requests/me', analyticsCtrl.listMyRequests);
router.get('/requests', authorize('ADMIN', 'HR'), analyticsCtrl.listPendingRequests);
router.patch('/requests/:id/review', authorize('ADMIN', 'HR'), analyticsCtrl.reviewRequest);

// ---------- Orçamento / Analytics ----------
router.post('/budgets', authorize('ADMIN', 'HR'), analyticsCtrl.setBudget);
router.get('/reports/costs', authorize('ADMIN', 'HR'), analyticsCtrl.getCostReport);
router.get('/reports/costs-by-department', authorize('ADMIN', 'HR'), analyticsCtrl.getCostByDepartment);

module.exports = router;
