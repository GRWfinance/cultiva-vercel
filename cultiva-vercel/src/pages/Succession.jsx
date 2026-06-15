import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconUsers } from '../components/Icons';

const performanceLabels = { 1: 'Performance baixa', 2: 'Performance média', 3: 'Performance alta' };
const potentialLabels = { 1: 'Potencial baixo', 2: 'Potencial médio', 3: 'Potencial alto' };

const readinessLabels = {
  READY_NOW: { label: 'Pronto agora', cls: 'badge-sage' },
  READY_1_2_YEARS: { label: '1-2 anos', cls: 'badge-gold' },
  DEVELOPING: { label: 'Em desenvolvimento', cls: 'badge-neutral' },
};

function currentYear() {
  return String(new Date().getFullYear());
}

function cellStyle(performance, potential) {
  const score = performance + potential;
  if (score >= 5) return { background: 'var(--sage-50)', border: '1px solid var(--sage-100)' };
  if (score === 4) return { background: 'var(--gold-50)', border: '1px solid var(--gold-100)' };
  return { background: 'var(--bg-surface-sunken)', border: '1px solid var(--border-color)' };
}

export default function Succession() {
  const [cycle, setCycle] = useState(currentYear());
  const { data: matrix, loading, error, refetch } = useApi(`/succession/matrix?cycle=${cycle}`);
  const { data: positions, loading: posLoading } = useApi('/succession/critical-positions');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Sucessão</h1>
          <p className="subtitle">Matriz 9-box e mapeamento de talentos para sucessão.</p>
        </div>
        <input
          type="text"
          value={cycle}
          onChange={e => setCycle(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 14, width: 100 }}
        />
      </div>

      <div className="page-content">
        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {matrix && matrix.totalEntries === 0 && (
          <div className="card">
            <EmptyState title="Nenhum colaborador posicionado neste ciclo" description="Posicione colaboradores na matriz 9-box para visualizar aqui." />
          </div>
        )}

        {matrix && matrix.totalEntries > 0 && (
          <div className="card">
            <div className="card-header">
              <h3><IconUsers style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Matriz 9-box — {matrix.cycle}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', gap: 8 }}>
              <div></div>
              {[1, 2, 3].map(p => (
                <div key={p} style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 500, padding: '8px 0' }}>
                  {performanceLabels[p]}
                </div>
              ))}

              {[3, 2, 1].map(potential => (
                <React.Fragment key={potential}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 500, writingMode: 'vertical-rl', textOrientation: 'mixed', justifyContent: 'center', padding: '8px 0' }}>
                    {potentialLabels[potential]}
                  </div>
                  {[1, 2, 3].map(performance => {
                    const cell = matrix.grid[`${performance}-${potential}`] || [];
                    return (
                      <div key={`${performance}-${potential}`} style={{ ...cellStyle(performance, potential), borderRadius: 'var(--radius-md)', padding: 10, minHeight: 100 }}>
                        {cell.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {cell.map(entry => (
                              <div key={entry.id} style={{ fontSize: 13 }}>
                                <div style={{ fontWeight: 500 }}>{entry.employee.name}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{entry.employee.jobTitle || entry.employee.department?.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {!posLoading && positions && Object.keys(positions).length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Posições críticas e sucessores</h3>
            </div>
            <div className="list">
              {Object.entries(positions).map(([position, candidates]) => (
                <div className="list-row" key={position} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div className="list-row-title">{position}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {candidates.map((c, idx) => (
                      <span key={idx} className={`badge ${readinessLabels[c.readiness]?.cls}`}>
                        {c.candidate.name} · {readinessLabels[c.readiness]?.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
