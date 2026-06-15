import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconCalendar, IconPlus, IconCheck, IconClock, IconX, IconChevronRight } from '../components/Icons';

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const statusLabels = {
  SCHEDULED: { label: 'Agendado', cls: 'badge-sage' },
  COMPLETED: { label: 'Concluído', cls: 'badge-neutral' },
  CANCELLED: { label: 'Cancelado', cls: 'badge-terra' },
  RESCHEDULED: { label: 'Reagendado', cls: 'badge-gold' },
};

const actionStatusIcon = {
  PENDING: <IconClock style={{ width: 16, height: 16, color: 'var(--gold-500)' }} />,
  IN_PROGRESS: <IconClock style={{ width: 16, height: 16, color: 'var(--terra-500)' }} />,
  DONE: <IconCheck style={{ width: 16, height: 16, color: 'var(--sage-500)' }} />,
  CANCELLED: <IconX style={{ width: 16, height: 16, color: 'var(--ink-faint)' }} />,
};

export default function OneOnOnes() {
  const { user } = useAuth();
  const { data: oneOnOnes, loading, error, refetch } = useApi('/one-on-ones');
  const [selectedId, setSelectedId] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (oneOnOnes && oneOnOnes.length > 0 && !selectedId) {
      setSelectedId(oneOnOnes[0].id);
    }
  }, [oneOnOnes, selectedId]);

  const { data: detail, loading: detailLoading, error: detailError, refetch: refetchDetail } = useApi(
    selectedId ? `/one-on-ones/${selectedId}` : null,
    { enabled: !!selectedId, deps: [selectedId] }
  );

  async function handleAddTopic(e) {
    e.preventDefault();
    if (!newTopic.trim() || !selectedId) return;
    try {
      await api.post(`/one-on-ones/${selectedId}/topics`, { title: newTopic });
      setNewTopic('');
      refetchDetail();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim() || !selectedId) return;
    try {
      await api.post(`/one-on-ones/${selectedId}/notes`, { content: newNote });
      setNewNote('');
      refetchDetail();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>1:1s</h1>
          <p className="subtitle">Reuniões individuais com pauta colaborativa, notas e próximos passos.</p>
        </div>
        <button className="btn btn-primary"><IconPlus style={{ width: 16, height: 16 }} /> Agendar 1:1</button>
      </div>

      <div className="page-content">
        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {oneOnOnes && oneOnOnes.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhum 1:1 agendado" description="Agende seu primeiro 1:1 para começar a acompanhar pautas e notas." />
          </div>
        )}

        {oneOnOnes && oneOnOnes.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 24 }}>
            {/* Lista lateral */}
            <div className="card" style={{ padding: 12 }}>
              <div className="list">
                {oneOnOnes.map(o => {
                  const other = o.employee?.id === user?.id ? o.manager : o.employee;
                  return (
                    <div
                      key={o.id}
                      className="list-row"
                      onClick={() => setSelectedId(o.id)}
                      style={{
                        cursor: 'pointer',
                        padding: '12px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: selectedId === o.id ? 'var(--sage-50)' : 'transparent',
                        border: 'none',
                        marginBottom: 2,
                      }}
                    >
                      <div className="list-row-main">
                        <div className="avatar">{initials(other?.name || '')}</div>
                        <div>
                          <div className="list-row-title">{other?.name}</div>
                          <div className="list-row-subtitle">{formatDateTime(o.scheduledAt)}</div>
                        </div>
                      </div>
                      <span className={`badge ${statusLabels[o.status]?.cls}`}>{statusLabels[o.status]?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalhe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {detailLoading && <div className="card"><Loading /></div>}
              {detailError && <div className="card"><ErrorState message={detailError} onRetry={refetchDetail} /></div>}

              {detail && (() => {
                const other = detail.employee?.id === user?.id ? detail.manager : detail.employee;
                return (
                  <>
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3 style={{ fontSize: 18, marginBottom: 4 }}>1:1 com {other?.name}</h3>
                          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{formatDateTime(detail.scheduledAt)} · {detail.durationMin} min</p>
                        </div>
                        <span className={`badge ${statusLabels[detail.status]?.cls}`}>{statusLabels[detail.status]?.label}</span>
                      </div>
                    </div>

                    {/* Pauta colaborativa */}
                    <div className="card">
                      <div className="card-header">
                        <h3><IconCalendar style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Pauta da reunião</h3>
                        <span className="badge badge-neutral">{detail.topics.length} itens</span>
                      </div>
                      {detail.topics.length === 0 ? (
                        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Nenhum item na pauta ainda.</p>
                      ) : (
                        <div className="list">
                          {detail.topics.map(t => (
                            <div className="list-row" key={t.id}>
                              <div>
                                <div className="list-row-title">{t.title}</div>
                                {t.description && <div className="list-row-subtitle">{t.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <input
                          type="text"
                          placeholder="Adicionar item à pauta..."
                          value={newTopic}
                          onChange={e => setNewTopic(e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-body)', fontSize: 14 }}
                        />
                        <button className="btn btn-secondary" type="submit"><IconPlus style={{ width: 15, height: 15 }} /> Adicionar</button>
                      </form>
                    </div>

                    {/* Próximos passos */}
                    <div className="card">
                      <div className="card-header">
                        <h3>Próximos passos</h3>
                      </div>
                      {detail.actionItems.length === 0 ? (
                        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Nenhuma ação registrada.</p>
                      ) : (
                        <div className="list">
                          {detail.actionItems.map(a => (
                            <div className="list-row" key={a.id}>
                              <div className="list-row-main">
                                {actionStatusIcon[a.status]}
                                <div>
                                  <div className="list-row-title">{a.description}</div>
                                  <div className="list-row-subtitle">Responsável: {a.owner?.name}{a.dueDate && ` · prazo ${new Date(a.dueDate).toLocaleDateString('pt-BR')}`}</div>
                                </div>
                              </div>
                              <IconChevronRight style={{ width: 16, height: 16, color: 'var(--ink-faint)' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    <div className="card">
                      <div className="card-header">
                        <h3>Notas da reunião</h3>
                      </div>
                      {detail.notes.map(n => (
                        <p key={n.id} style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 10 }}>{n.content}</p>
                      ))}
                      <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea placeholder="Escreva uma nota..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                        <button className="btn btn-secondary btn-sm" type="submit" style={{ alignSelf: 'flex-start' }}>Salvar nota</button>
                      </form>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
