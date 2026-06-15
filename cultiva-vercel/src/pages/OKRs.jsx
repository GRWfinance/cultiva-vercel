import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconTarget, IconPlus, IconChevronRight, IconArrowUpRight } from '../components/Icons';

const scopeLabels = {
  COMPANY: { label: 'Empresa', cls: 'badge-terra' },
  DEPARTMENT: { label: 'Departamento', cls: 'badge-gold' },
  INDIVIDUAL: { label: 'Individual', cls: 'badge-sage' },
};

const statusLabels = {
  ON_TRACK: { label: 'No caminho', cls: 'badge-sage' },
  AT_RISK: { label: 'Em risco', cls: 'badge-gold' },
  OFF_TRACK: { label: 'Fora do caminho', cls: 'badge-terra' },
  COMPLETED: { label: 'Concluído', cls: 'badge-neutral' },
};

function currentCycle() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function ProgressBar({ value, color = 'var(--sage-500)' }) {
  return (
    <div className="wallet-card-bar-track">
      <div className="wallet-card-bar-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function ObjectiveDetail({ objectiveId, onClose, onUpdated }) {
  const { data, loading, error, refetch } = useApi(`/okrs/${objectiveId}`);
  const [checkInValues, setCheckInValues] = useState({});

  async function handleCheckIn(krId) {
    const value = checkInValues[krId];
    if (value === undefined || value === '') return;
    try {
      await api.post(`/okrs/key-results/${krId}/check-in`, { value: parseFloat(value) });
      setCheckInValues(prev => ({ ...prev, [krId]: '' }));
      refetch();
      onUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="card"><Loading /></div>;
  if (error) return <div className="card"><ErrorState message={error} onRetry={refetch} /></div>;
  if (!data) return null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>{data.title}</h3>
          {data.description && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{data.description}</p>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Fechar</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <span className={`badge ${scopeLabels[data.scope]?.cls}`}>{scopeLabels[data.scope]?.label}</span>
        <span className={`badge ${statusLabels[data.status]?.cls}`}>{statusLabels[data.status]?.label}</span>
        <span className="badge badge-neutral">Responsável: {data.owner?.name}</span>
      </div>

      <div className="list">
        {data.keyResults.map(kr => {
          const range = kr.targetValue - kr.startValue;
          const pct = range === 0 ? (kr.currentValue >= kr.targetValue ? 100 : 0) : Math.max(0, Math.min(100, ((kr.currentValue - kr.startValue) / range) * 100));
          return (
            <div className="list-row" key={kr.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div className="list-row-title">{kr.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                  {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                </div>
              </div>
              <ProgressBar value={Math.round(pct)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  type="number"
                  placeholder="Novo valor"
                  value={checkInValues[kr.id] ?? ''}
                  onChange={e => setCheckInValues(prev => ({ ...prev, [kr.id]: e.target.value }))}
                  style={{ width: 120, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 13 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => handleCheckIn(kr.id)}>Check-in</button>
              </div>
              {kr.checkIns?.length > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Último check-in: {kr.checkIns[0].value}{kr.unit} por {kr.checkIns[0].author?.name} em {new Date(kr.checkIns[0].createdAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.children?.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, marginTop: 20, marginBottom: 10, color: 'var(--ink-soft)' }}>Objetivos alinhados</h3>
          <div className="list">
            {data.children.map(c => (
              <div className="list-row" key={c.id}>
                <div>
                  <div className="list-row-title">{c.title}</div>
                  <div className="list-row-subtitle">Responsável: {c.owner?.name}</div>
                </div>
                <span className="badge badge-sage">{c.progress}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OKRs() {
  const [cycle, setCycle] = useState(currentCycle());
  const [selectedId, setSelectedId] = useState(null);
  const { data: dashboard, loading: dashLoading, error: dashError, refetch: refetchDash } = useApi(`/okrs/dashboard?cycle=${cycle}`);
  const { data: objectives, loading, error, refetch } = useApi(`/okrs?cycle=${cycle}`);

  function refreshAll() {
    refetch();
    refetchDash();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>OKRs</h1>
          <p className="subtitle">Objetivos e resultados-chave alinhados por time e empresa.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={cycle}
            onChange={e => setCycle(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 14, width: 120 }}
          />
          <button className="btn btn-primary"><IconPlus style={{ width: 16, height: 16 }} /> Novo objetivo</button>
        </div>
      </div>

      <div className="page-content">
        {dashLoading && <Loading />}
        {dashError && <ErrorState message={dashError} onRetry={refetchDash} />}
        {dashboard && (
          <div className="grid grid-4">
            <div className="stat-card">
              <div className="stat-label">Progresso geral</div>
              <div className="stat-value">{dashboard.overallProgress}%</div>
              <div className="stat-meta">Ciclo {dashboard.cycle}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">No caminho</div>
              <div className="stat-value">{dashboard.statusCounts?.ON_TRACK || 0}</div>
              <div className="stat-meta">objetivos</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Em risco</div>
              <div className="stat-value">{dashboard.statusCounts?.AT_RISK || 0}</div>
              <div className="stat-meta">objetivos</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Concluídos</div>
              <div className="stat-value">{dashboard.statusCounts?.COMPLETED || 0}</div>
              <div className="stat-meta">objetivos</div>
            </div>
          </div>
        )}

        {selectedId && (
          <ObjectiveDetail objectiveId={selectedId} onClose={() => setSelectedId(null)} onUpdated={refreshAll} />
        )}

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {objectives && objectives.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhum objetivo neste ciclo" description="Crie o primeiro objetivo para começar a acompanhar OKRs." />
          </div>
        )}

        {objectives && objectives.length > 0 && (
          <div className="grid grid-2">
            {['COMPANY', 'DEPARTMENT', 'INDIVIDUAL'].map(scope => {
              const items = objectives.filter(o => o.scope === scope);
              if (items.length === 0) return null;
              return (
                <div className="card" key={scope} style={{ gridColumn: scope === 'COMPANY' ? '1 / -1' : 'auto' }}>
                  <div className="card-header">
                    <h3><IconTarget style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />{scopeLabels[scope].label}</h3>
                  </div>
                  <div className="list">
                    {items.map(o => (
                      <div className="list-row" key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(o.id)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div className="list-row-title">{o.title}</div>
                            <span className={`badge ${statusLabels[o.status]?.cls}`}>{statusLabels[o.status]?.label}</span>
                          </div>
                          <div className="list-row-subtitle" style={{ marginBottom: 6 }}>{o.owner?.name} · {o.keyResults.length} key results</div>
                          <ProgressBar value={o.progress} />
                        </div>
                        <IconChevronRight style={{ width: 16, height: 16, color: 'var(--ink-faint)', flexShrink: 0, marginLeft: 8 }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
