import React from 'react';
import { useApi } from '../api/useApi';
import { Loading, ErrorState } from '../components/States';
import { IconTrendingUp, IconUsers, IconClipboard, IconBookOpen } from '../components/Icons';

function Bar({ label, value, max, color = 'var(--sage-500)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: 'var(--ink-soft)' }}>{value}</span>
      </div>
      <div className="wallet-card-bar-track">
        <div className="wallet-card-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function PeopleAnalytics() {
  const { data: overview, loading: l1, error: e1, refetch: r1 } = useApi('/people-analytics/overview');
  const { data: engagement, loading: l2 } = useApi('/people-analytics/engagement');
  const { data: performance, loading: l3 } = useApi('/people-analytics/performance');
  const { data: learning, loading: l4 } = useApi('/people-analytics/learning');

  const loading = l1 || l2 || l3 || l4;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>People Analytics</h1>
          <p className="subtitle">Dashboards e indicadores de pessoas em tempo real.</p>
        </div>
      </div>

      <div className="page-content">
        {l1 && <Loading />}
        {e1 && <ErrorState message={e1} onRetry={r1} />}

        {overview && (
          <>
            <div className="grid grid-4">
              <div className="stat-card">
                <div className="stat-label">Colaboradores ativos</div>
                <div className="stat-value">{overview.headcount.active}</div>
                <div className="stat-meta">de {overview.headcount.total} no total</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Turnover</div>
                <div className="stat-value">{overview.turnoverRate}%</div>
                <div className="stat-meta">acumulado</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Score médio de desempenho</div>
                <div className="stat-value">{performance?.average ?? '—'}</div>
                <div className="stat-meta">{performance?.cycle?.name || 'sem ciclo encerrado'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Conclusão de treinamentos</div>
                <div className="stat-value">{learning?.completionRate ?? 0}%</div>
                <div className="stat-meta">{learning?.totalCompletions ?? 0} de {learning?.totalEnrollments ?? 0} inscrições</div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="card-header">
                  <h3><IconUsers style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Headcount por departamento</h3>
                </div>
                {overview.headcountByDepartment.map(d => (
                  <Bar key={d.department} label={d.department} value={d.headcount} max={Math.max(...overview.headcountByDepartment.map(x => x.headcount), 1)} />
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Tempo de empresa</h3>
                </div>
                {Object.entries(overview.tenureDistribution).map(([label, value]) => (
                  <Bar key={label} label={label} value={value} max={Math.max(...Object.values(overview.tenureDistribution), 1)} color="var(--terra-500)" />
                ))}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="card-header">
                  <h3><IconTrendingUp style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Engajamento (pesquisas recentes)</h3>
                </div>
                {engagement?.recentSurveys?.length > 0 ? (
                  <div className="list">
                    {engagement.recentSurveys.map(s => (
                      <div className="list-row" key={s.surveyId}>
                        <div>
                          <div className="list-row-title">{s.title}</div>
                          <div className="list-row-subtitle">{s.type}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {s.enps != null && <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>eNPS {s.enps}</div>}
                          {s.average != null && s.enps == null && <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{s.average}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Nenhuma pesquisa encerrada ainda.</p>}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3><IconClipboard style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Distribuição de desempenho</h3>
                </div>
                {performance?.distribution ? (
                  Object.entries(performance.distribution).map(([label, value]) => (
                    <Bar key={label} label={label} value={value} max={Math.max(...Object.values(performance.distribution), 1)} color="var(--gold-500)" />
                  ))
                ) : <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Nenhum ciclo de avaliação encerrado ainda.</p>}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3><IconBookOpen style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Cursos mais procurados</h3>
              </div>
              {learning?.topCourses?.length > 0 ? (
                <div className="list">
                  {learning.topCourses.map(c => (
                    <div className="list-row" key={c.title}>
                      <div className="list-row-title">{c.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{c.completions}/{c.enrollments} concluídos</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Nenhuma inscrição registrada ainda.</p>}
            </div>
          </>
        )}
      </div>
    </>
  );
}
