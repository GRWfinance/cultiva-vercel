import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../api/useApi';
import { Loading, ErrorState } from '../components/States';
import { IconCalendar, IconClipboard, IconWallet, IconMessage, IconArrowUpRight, IconCheck, IconClock } from '../components/Icons';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export default function Home() {
  const { user } = useAuth();

  const { data: oneOnOnes, loading: l1, error: e1, refetch: r1 } = useApi('/one-on-ones?status=SCHEDULED');
  const { data: actionItems, loading: l2 } = useApi('/one-on-ones/my-action-items');
  const { data: wallet, loading: l3 } = useApi('/benefits/wallet/me');
  const { data: feedbacks, loading: l4 } = useApi('/feedbacks/received');
  const { data: kudos, loading: l5 } = useApi('/kudos');

  const loading = l1 || l2 || l3 || l4 || l5;

  const upcoming = (oneOnOnes || []).slice(0, 3);
  const pendingActions = (actionItems || []).filter(a => a.status !== 'DONE').slice(0, 3);
  const recentFeedback = (feedbacks || [])[0];
  const recentKudos = (kudos || [])[0];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="subtitle">Aqui está um resumo do que está acontecendo com seu time hoje.</p>
        </div>
      </div>

      <div className="page-content">
        {e1 && <ErrorState message={e1} onRetry={r1} />}

        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-label">Próximos 1:1s</div>
            <div className="stat-value">{oneOnOnes?.length ?? '—'}</div>
            <div className="stat-meta">Agendados</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ações pendentes</div>
            <div className="stat-value">{pendingActions.length}</div>
            <div className="stat-meta">De 1:1s e PDIs</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Saldo de benefícios</div>
            <div className="stat-value">{wallet ? formatCurrency(wallet.totalBalance) : '—'}</div>
            <div className="stat-meta">Disponível este mês</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Feedbacks recebidos</div>
            <div className="stat-value">{feedbacks?.length ?? '—'}</div>
            <div className="stat-meta">No total</div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* Próximos 1:1s */}
          <div className="card">
            <div className="card-header">
              <h3><IconCalendar style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Próximos 1:1s</h3>
              <Link to="/1-1s" className="btn btn-ghost btn-sm">Ver todos <IconArrowUpRight style={{ width: 14, height: 14 }} /></Link>
            </div>
            {l1 ? <Loading /> : upcoming.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum 1:1 agendado. Que tal marcar um?</p>
              </div>
            ) : (
              <div className="list">
                {upcoming.map(o => {
                  const other = o.employee?.id === user?.id ? o.manager : o.employee;
                  return (
                    <Link to="/1-1s" key={o.id} className="list-row" style={{ cursor: 'pointer' }}>
                      <div className="list-row-main">
                        <div className="avatar">{initials(other?.name || '')}</div>
                        <div>
                          <div className="list-row-title">{other?.name}</div>
                          <div className="list-row-subtitle">{formatDate(o.scheduledAt)} às {formatTime(o.scheduledAt)}</div>
                        </div>
                      </div>
                      {o.topics?.length > 0 && <span className="badge badge-sage">{o.topics.length} na pauta</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ações pendentes */}
          <div className="card">
            <div className="card-header">
              <h3><IconClipboard style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Suas pendências</h3>
            </div>
            {l2 ? <Loading /> : pendingActions.length === 0 ? (
              <div className="empty-state">
                <p>Tudo em dia! Nenhuma ação pendente.</p>
              </div>
            ) : (
              <div className="list">
                {pendingActions.map(a => (
                  <div className="list-row" key={a.id}>
                    <div className="list-row-main">
                      <div style={{ color: a.status === 'IN_PROGRESS' ? 'var(--gold-500)' : 'var(--ink-faint)' }}>
                        {a.status === 'IN_PROGRESS' ? <IconClock style={{ width: 18, height: 18 }} /> : <IconCheck style={{ width: 18, height: 18 }} />}
                      </div>
                      <div>
                        <div className="list-row-title">{a.description}</div>
                        {a.dueDate && <div className="list-row-subtitle">Prazo {new Date(a.dueDate).toLocaleDateString('pt-BR')}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-2">
          {/* Benefícios resumo */}
          <div className="card">
            <div className="card-header">
              <h3><IconWallet style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Seus benefícios</h3>
              <Link to="/beneficios" className="btn btn-ghost btn-sm">Ver carteira <IconArrowUpRight style={{ width: 14, height: 14 }} /></Link>
            </div>
            {l3 ? <Loading /> : !wallet || wallet.items.length === 0 ? (
              <div className="empty-state"><p>Nenhum benefício atribuído ainda.</p></div>
            ) : (
              <div className="grid grid-2">
                {wallet.items.slice(0, 4).map(item => {
                  const pct = item.value > 0 ? Math.round((item.balance / item.value) * 100) : 0;
                  return (
                    <div key={item.grantId} className="wallet-card" style={{ padding: 14, gap: 10 }}>
                      <div>
                        <div className="wallet-card-name" style={{ fontSize: 14.5 }}>{item.benefit}</div>
                        <div className="wallet-card-provider">{item.provider}</div>
                      </div>
                      <div className="wallet-card-balance" style={{ fontSize: 20 }}>{formatCurrency(item.balance)}</div>
                      <div className="wallet-card-bar-track">
                        <div className="wallet-card-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reconhecimento recente */}
          <div className="card">
            <div className="card-header">
              <h3><IconMessage style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Reconhecimento recente</h3>
            </div>
            {(l5 && l4) ? <Loading /> : (!recentKudos && !recentFeedback) ? (
              <div className="empty-state"><p>Nenhuma novidade por aqui ainda.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentKudos && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="avatar" style={{ background: 'var(--terra-100)', color: 'var(--terra-700)' }}>{initials(recentKudos.sender?.name)}</div>
                    <div>
                      <p style={{ fontSize: 14 }}>
                        <strong style={{ fontWeight: 500 }}>{recentKudos.sender?.name}</strong> elogiou <strong style={{ fontWeight: 500 }}>{recentKudos.receiver?.name}</strong>
                      </p>
                      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>"{recentKudos.message}"</p>
                      <div style={{ marginTop: 8 }}>
                        {recentKudos.values?.map(v => <span key={v} className="badge badge-gold" style={{ marginRight: 6 }}>{v}</span>)}
                      </div>
                    </div>
                  </div>
                )}
                {recentFeedback && (
                  <div style={{ borderTop: recentKudos ? '1px solid var(--border-color)' : 'none', paddingTop: recentKudos ? 16 : 0, display: 'flex', gap: 12 }}>
                    <div className="avatar">{recentFeedback.sender ? initials(recentFeedback.sender.name) : '?'}</div>
                    <div>
                      <p style={{ fontSize: 14 }}>
                        Você recebeu um feedback {recentFeedback.type === 'POSITIVE' ? 'positivo' : 'construtivo'}
                      </p>
                      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>"{recentFeedback.content?.slice(0, 110)}{recentFeedback.content?.length > 110 ? '...' : ''}"</p>
                      <Link to="/feedbacks" className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: '4px 0' }}>Ler completo <IconArrowUpRight style={{ width: 13, height: 13 }} /></Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
