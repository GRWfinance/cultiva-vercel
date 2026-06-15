import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import {
  IconWallet, IconPlus, IconCoffee, IconBookOpen, IconHeart, IconDollar,
  IconCheck, IconX, IconTrendingUp, IconAlertCircle,
} from '../components/Icons';

const benefitTypeLabels = {
  TICKET_CULTURA: 'Ticket Cultura',
  TICKET_LIVRO: 'Ticket Livro',
  TICKET_ALIMENTACAO: 'Ticket Alimentação',
  TICKET_REFEICAO: 'Ticket Refeição',
  PLANO_SAUDE: 'Plano de Saúde',
  PLANO_ODONTO: 'Plano Odontológico',
  GYMPASS: 'Gympass',
  AUXILIO_HOME_OFFICE: 'Auxílio Home Office',
  AUXILIO_EDUCACAO: 'Auxílio Educação',
  VALE_TRANSPORTE: 'Vale Transporte',
  OUTRO: 'Outro',
};

const periodicityLabels = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
  ONE_TIME: 'Único',
};

const requestTypeLabels = {
  NEW_BENEFIT: 'Novo benefício',
  CHANGE_PLAN: 'Troca de plano',
  CANCELLATION: 'Cancelamento',
  REIMBURSEMENT: 'Reembolso',
};

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const typeIcons = {
  TICKET_CULTURA: IconBookOpen,
  TICKET_LIVRO: IconBookOpen,
  TICKET_ALIMENTACAO: IconCoffee,
  TICKET_REFEICAO: IconCoffee,
  PLANO_SAUDE: IconHeart,
  PLANO_ODONTO: IconHeart,
  GYMPASS: IconHeart,
  AUXILIO_HOME_OFFICE: IconDollar,
  AUXILIO_EDUCACAO: IconBookOpen,
  VALE_TRANSPORTE: IconDollar,
  OUTRO: IconDollar,
};

const requestStatusBadge = {
  PENDING: { label: 'Pendente', cls: 'badge-gold' },
  APPROVED: { label: 'Aprovado', cls: 'badge-sage' },
  REJECTED: { label: 'Rejeitado', cls: 'badge-terra' },
  CANCELLED: { label: 'Cancelado', cls: 'badge-neutral' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ============================================
// Aba: Minha carteira (visão colaborador)
// ============================================
function MyWalletTab() {
  const { data: wallet, loading, error, refetch } = useApi('/benefits/wallet/me');

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!wallet) return null;

  if (wallet.items.length === 0) {
    return <div className="card"><EmptyState title="Nenhum benefício atribuído" description="Quando o RH conceder benefícios, eles aparecerão aqui." /></div>;
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20, background: 'var(--sage-700)', border: 'none', color: '#FBF8F1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="stat-label" style={{ color: 'var(--sage-100)' }}>Saldo total disponível</div>
            <div className="stat-value" style={{ color: '#FBF8F1', fontSize: 38 }}>{formatCurrency(wallet.totalBalance)}</div>
            <div className="stat-meta" style={{ color: 'var(--sage-100)' }}>Renovação em {wallet.items[0]?.periodEnd ? new Date(wallet.items[0].periodEnd).toLocaleDateString('pt-BR') : '-'}</div>
          </div>
          <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.12)', color: '#FBF8F1', borderColor: 'rgba(255,255,255,0.2)' }}>
            <IconPlus style={{ width: 15, height: 15 }} /> Solicitar benefício
          </button>
        </div>
      </div>

      <div className="grid grid-3">
        {wallet.items.map(item => {
          const pct = item.value > 0 ? Math.round((item.balance / item.value) * 100) : 0;
          const Icon = typeIcons[item.type] || IconDollar;
          return (
            <div key={item.grantId} className="wallet-card">
              <div className="wallet-card-top">
                <div>
                  <div className="wallet-card-name">{item.benefit}</div>
                  <div className="wallet-card-provider">{item.provider}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sage-50)', color: 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <div>
                <div className="wallet-card-balance">{formatCurrency(item.balance)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>de {formatCurrency(item.value)} concedidos</div>
              </div>
              <div className="wallet-card-bar-track">
                <div className="wallet-card-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="wallet-card-footer">
                <span>{pct}% disponível</span>
                <span>Renova {new Date(item.periodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================
// Aba: Catálogo de benefícios (visão RH/Admin)
// ============================================
function CatalogTab() {
  const { data: benefits, loading, error, refetch } = useApi('/benefits');

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!benefits || benefits.length === 0) {
    return <div className="card"><EmptyState title="Nenhum benefício cadastrado" description="Cadastre o primeiro benefício para começar." /></div>;
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-sunken)' }}>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 500, color: 'var(--ink-soft)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Benefício</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 500, color: 'var(--ink-soft)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Operadora</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 500, color: 'var(--ink-soft)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Valor padrão</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 500, color: 'var(--ink-soft)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Periodicidade</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 500, color: 'var(--ink-soft)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {benefits.map(b => {
              const Icon = typeIcons[b.type] || IconDollar;
              return (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sage-50)', color: 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 15, height: 15 }} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{b.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink-soft)' }}>{b.provider || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>{formatCurrency(b.defaultValue)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink-soft)' }}>{periodicityLabels[b.periodicity]}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${b.active ? 'badge-sage' : 'badge-neutral'}`}>{b.active ? 'Ativo' : 'Inativo'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Aba: Solicitações (workflow de aprovação - RH)
// ============================================
function RequestsTab() {
  const { data: requests, loading, error, refetch } = useApi('/benefits/requests');

  async function handleReview(id, status) {
    try {
      await api.patch(`/benefits/requests/${id}/review`, { status });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!requests || requests.length === 0) {
    return <div className="card"><EmptyState title="Nenhuma solicitação" description="Solicitações de benefícios dos colaboradores aparecerão aqui." /></div>;
  }

  return (
    <div className="card">
      <div className="list">
        {requests.map(r => (
          <div className="list-row" key={r.id}>
            <div className="list-row-main">
              <div className="avatar">{initials(r.user?.name)}</div>
              <div>
                <div className="list-row-title">{r.user?.name} · {requestTypeLabels[r.type]}</div>
                <div className="list-row-subtitle">{r.description}</div>
                <div className="list-row-subtitle" style={{ marginTop: 2 }}>{formatDate(r.createdAt)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${requestStatusBadge[r.status]?.cls}`}>{requestStatusBadge[r.status]?.label}</span>
              {r.status === 'PENDING' && (
                <>
                  <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--sage-300)', color: 'var(--sage-700)' }} onClick={() => handleReview(r.id, 'APPROVED')}><IconCheck style={{ width: 14, height: 14 }} /> Aprovar</button>
                  <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--terra-300)', color: 'var(--terra-700)' }} onClick={() => handleReview(r.id, 'REJECTED')}><IconX style={{ width: 14, height: 14 }} /> Rejeitar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Aba: Relatórios / orçamento (RH)
// ============================================
function ReportsTab() {
  const { data: costReport, loading: l1, error: e1, refetch: r1 } = useApi('/benefits/reports/costs');
  const { data: costByDepartment, loading: l2, error: e2, refetch: r2 } = useApi('/benefits/reports/costs-by-department');

  if (l1 || l2) return <Loading />;
  if (e1) return <ErrorState message={e1} onRetry={r1} />;
  if (e2) return <ErrorState message={e2} onRetry={r2} />;
  if (!costReport) return null;

  const { totals, byBenefit } = costReport;
  const usagePct = totals.plannedBudget > 0 ? Math.round((totals.totalGranted / totals.plannedBudget) * 100) : 0;
  const spentPct = totals.totalGranted > 0 ? Math.round((totals.totalSpent / totals.totalGranted) * 100) : 0;

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Orçamento planejado</div>
          <div className="stat-value">{formatCurrency(totals.plannedBudget)}</div>
          <div className="stat-meta">Para o período</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total concedido</div>
          <div className="stat-value">{formatCurrency(totals.totalGranted)}</div>
          <div className="stat-meta">{usagePct}% do orçamento</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total utilizado</div>
          <div className="stat-value">{formatCurrency(totals.totalSpent)}</div>
          <div className="stat-meta">{spentPct}% do concedido</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3><IconTrendingUp style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Custo por benefício</h3>
          </div>
          {byBenefit.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Sem dados para o período.</p>
          ) : (
            <div className="list">
              {byBenefit.map(b => {
                const Icon = typeIcons[b.type] || IconDollar;
                const usagePctB = b.totalGranted > 0 ? Math.round((b.totalSpent / b.totalGranted) * 100) : 0;
                const overBudget = b.totalGranted > b.plannedBudget;
                return (
                  <div className="list-row" key={b.benefitId}>
                    <div className="list-row-main">
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sage-50)', color: 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 15, height: 15 }} />
                      </div>
                      <div>
                        <div className="list-row-title">{b.benefitName}</div>
                        <div className="list-row-subtitle">{b.beneficiariesCount} colaboradores · {usagePctB}% utilizado</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{formatCurrency(b.totalGranted)}</div>
                      {overBudget && (
                        <div style={{ fontSize: 12, color: 'var(--terra-500)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <IconAlertCircle style={{ width: 12, height: 12 }} /> acima do orçamento
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Custo por departamento</h3>
          </div>
          {!costByDepartment || costByDepartment.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Sem dados.</p>
          ) : (
            <div className="list">
              {costByDepartment.map(d => (
                <div className="list-row" key={d.departmentId}>
                  <div>
                    <div className="list-row-title">{d.departmentName}</div>
                    <div className="list-row-subtitle">{d.headcount} colaboradores</div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{formatCurrency(d.totalBenefitsCost)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Benefits() {
  const { user } = useAuth();
  const isHR = ['ADMIN', 'HR'].includes(user?.role);
  const [tab, setTab] = useState('wallet');

  const tabs = [
    { id: 'wallet', label: 'Minha carteira' },
    { id: 'catalog', label: 'Catálogo' },
    ...(isHR ? [
      { id: 'requests', label: 'Solicitações' },
      { id: 'reports', label: 'Relatórios' },
    ] : []),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Benefícios</h1>
          <p className="subtitle">Ticket Cultura, Ticket Livro, alimentação, saúde e outros benefícios da empresa.</p>
        </div>
        {tab === 'catalog' && isHR && (
          <button className="btn btn-primary"><IconPlus style={{ width: 16, height: 16 }} /> Novo benefício</button>
        )}
      </div>

      <div className="page-content">
        <div className="tabs">
          {tabs.map(t => (
            <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} style={{ cursor: 'pointer' }}>
              {t.label}
            </div>
          ))}
        </div>

        {tab === 'wallet' && <MyWalletTab />}
        {tab === 'catalog' && <CatalogTab />}
        {tab === 'requests' && isHR && <RequestsTab />}
        {tab === 'reports' && isHR && <ReportsTab />}
      </div>
    </>
  );
}
