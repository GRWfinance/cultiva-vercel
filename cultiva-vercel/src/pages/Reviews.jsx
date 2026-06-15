import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconClipboard, IconCheck, IconClock } from '../components/Icons';

const typeLabels = {
  SELF: 'Autoavaliação',
  MANAGER: 'Avaliação do gestor',
  PEER: 'Avaliação de pares',
  UPWARD: 'Avaliação ascendente',
};

const statusLabels = {
  PENDING: { label: 'Pendente', cls: 'badge-gold' },
  IN_PROGRESS: { label: 'Em andamento', cls: 'badge-gold' },
  SUBMITTED: { label: 'Enviada', cls: 'badge-sage' },
};

const DEFAULT_COMPETENCIES = ['Comunicação', 'Execução', 'Colaboração', 'Liderança', 'Inovação'];

function ReviewForm({ review, onClose, onSubmitted }) {
  const [scores, setScores] = useState(() => {
    const initial = {};
    DEFAULT_COMPETENCIES.forEach(c => {
      const existing = review.answers?.find(a => a.competency === c);
      initial[c] = existing?.score || 3;
    });
    return initial;
  });
  const [comment, setComment] = useState(review.overallComment || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(submit) {
    setSaving(true);
    try {
      const answers = DEFAULT_COMPETENCIES.map(c => ({ competency: c, score: Number(scores[c]) }));
      await api.post(`/reviews/${review.id}/submit`, { answers, overallComment: comment, submit });
      onSubmitted();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{typeLabels[review.type]}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            {review.participant?.subject?.name} {review.participant?.subject?.jobTitle && `· ${review.participant.subject.jobTitle}`}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Fechar</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DEFAULT_COMPETENCIES.map(c => (
          <div key={c}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>{c}</label>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{scores[c]} / 5</span>
            </div>
            <input
              type="range" min="1" max="5" step="1"
              value={scores[c]}
              onChange={e => setScores(prev => ({ ...prev, [c]: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>
        ))}

        <div className="field">
          <label>Comentário geral</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Compartilhe observações adicionais..." />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={saving}>Salvar rascunho</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={saving}>Enviar avaliação</button>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { data: reviews, loading, error, refetch } = useApi('/reviews/my-reviews');
  const [activeReview, setActiveReview] = useState(null);

  const pending = reviews?.filter(r => r.status !== 'SUBMITTED') || [];
  const submitted = reviews?.filter(r => r.status === 'SUBMITTED') || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Avaliação de Desempenho</h1>
          <p className="subtitle">Ciclos de avaliação, autoavaliação e avaliação de gestor/pares.</p>
        </div>
      </div>

      <div className="page-content">
        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {activeReview && (
          <ReviewForm review={activeReview} onClose={() => setActiveReview(null)} onSubmitted={refetch} />
        )}

        {reviews && reviews.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhuma avaliação pendente" description="Quando um ciclo de avaliação for aberto pelo RH, suas avaliações aparecerão aqui." />
          </div>
        )}

        {pending.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3><IconClock style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Pendentes</h3>
            </div>
            <div className="list">
              {pending.map(r => (
                <div className="list-row" key={r.id} style={{ cursor: 'pointer' }} onClick={() => setActiveReview(r)}>
                  <div className="list-row-main">
                    <div className="avatar">{r.participant?.subject?.name?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}</div>
                    <div>
                      <div className="list-row-title">{typeLabels[r.type]} — {r.participant?.subject?.name}</div>
                      <div className="list-row-subtitle">{r.participant?.cycle?.name}</div>
                    </div>
                  </div>
                  <span className={`badge ${statusLabels[r.status]?.cls}`}>{statusLabels[r.status]?.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {submitted.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3><IconCheck style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />Enviadas</h3>
            </div>
            <div className="list">
              {submitted.map(r => (
                <div className="list-row" key={r.id}>
                  <div className="list-row-main">
                    <div className="avatar">{r.participant?.subject?.name?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}</div>
                    <div>
                      <div className="list-row-title">{typeLabels[r.type]} — {r.participant?.subject?.name}</div>
                      <div className="list-row-subtitle">{r.participant?.cycle?.name} · enviada em {new Date(r.submittedAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  <span className={`badge ${statusLabels[r.status]?.cls}`}>{statusLabels[r.status]?.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
