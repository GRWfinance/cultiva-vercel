import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconBookOpen, IconCheck, IconClock } from '../components/Icons';

const levelLabels = {
  BEGINNER: { label: 'Iniciante', cls: 'badge-sage' },
  INTERMEDIATE: { label: 'Intermediário', cls: 'badge-gold' },
  ADVANCED: { label: 'Avançado', cls: 'badge-terra' },
};

function CourseDetail({ courseId, onClose, onUpdated }) {
  const { data, loading, error, refetch } = useApi(`/learning/courses/${courseId}`);

  async function handleEnroll() {
    try {
      await api.post(`/learning/courses/${courseId}/enroll`);
      refetch();
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCompleteModule(moduleId) {
    try {
      await api.post(`/learning/modules/${moduleId}/complete`);
      refetch();
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="card"><Loading /></div>;
  if (error) return <div className="card"><ErrorState message={error} onRetry={refetch} /></div>;
  if (!data) return null;

  const completedModuleIds = new Set(data.myEnrollment?.moduleCompletions?.map(mc => mc.moduleId) || []);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{data.title}</h3>
          {data.description && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>{data.description}</p>}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className={`badge ${levelLabels[data.level]?.cls}`}>{levelLabels[data.level]?.label}</span>
            {data.category && <span className="badge badge-neutral">{data.category}</span>}
            {data.durationMin && <span className="badge badge-neutral">{data.durationMin} min</span>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Fechar</button>
      </div>

      {!data.myEnrollment ? (
        <button className="btn btn-primary" onClick={handleEnroll}>Inscrever-se</button>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <div className="wallet-card-bar-track">
              <div className="wallet-card-bar-fill" style={{ width: `${data.myEnrollment.progress}%` }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>{data.myEnrollment.progress}% concluído</p>
          </div>
          <div className="list">
            {data.modules.map(m => {
              const done = completedModuleIds.has(m.id);
              return (
                <div className="list-row" key={m.id}>
                  <div className="list-row-main">
                    {done ? <IconCheck style={{ width: 16, height: 16, color: 'var(--sage-500)' }} /> : <IconClock style={{ width: 16, height: 16, color: 'var(--ink-faint)' }} />}
                    <div>
                      <div className="list-row-title">{m.title}</div>
                      {m.durationMin && <div className="list-row-subtitle">{m.durationMin} min</div>}
                    </div>
                  </div>
                  {!done && <button className="btn btn-secondary btn-sm" onClick={() => handleCompleteModule(m.id)}>Concluir</button>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function Learning() {
  const { data: courses, loading, error, refetch } = useApi('/learning/courses?active=true');
  const { data: myEnrollments, refetch: refetchEnrollments } = useApi('/learning/my-enrollments');
  const [selectedId, setSelectedId] = useState(null);

  function handleUpdated() {
    refetch();
    refetchEnrollments();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Learning.Rocks</h1>
          <p className="subtitle">Trilhas de aprendizagem, cursos e certificações.</p>
        </div>
      </div>

      <div className="page-content">
        {selectedId && (
          <CourseDetail courseId={selectedId} onClose={() => setSelectedId(null)} onUpdated={handleUpdated} />
        )}

        {myEnrollments && myEnrollments.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Minhas trilhas</h3>
            </div>
            <div className="list">
              {myEnrollments.map(e => (
                <div className="list-row" key={e.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(e.course.id)}>
                  <div>
                    <div className="list-row-title">{e.course.title}</div>
                    <div className="list-row-subtitle">{e.course.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-sage">{e.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {courses && courses.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhum curso disponível" description="O catálogo de cursos aparecerá aqui quando o RH adicionar conteúdos." />
          </div>
        )}

        {courses && courses.length > 0 && (
          <div className="grid grid-3">
            {courses.map(c => (
              <div className="card" key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(c.id)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sage-50)', color: 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <IconBookOpen style={{ width: 18, height: 18 }} />
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>{c.title}</h3>
                {c.description && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>{c.description}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${levelLabels[c.level]?.cls}`}>{levelLabels[c.level]?.label}</span>
                  {c.durationMin && <span className="badge badge-neutral">{c.durationMin} min</span>}
                  <span className="badge badge-neutral">{c.enrollmentsCount} inscritos</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
