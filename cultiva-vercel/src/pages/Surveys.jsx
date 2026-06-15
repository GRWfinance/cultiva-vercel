import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconMessage, IconCheck } from '../components/Icons';

const typeLabels = {
  ENGAGEMENT: 'Engajamento',
  ENPS: 'eNPS',
  PULSE: 'Pulse',
  CLIMATE: 'Clima organizacional',
  CUSTOM: 'Personalizada',
};

function SurveyForm({ survey, onClose, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  function setAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const payload = survey.questions.map(q => ({ questionId: q.id, value: answers[q.id] ?? '' }));
      await api.post(`/surveys/${survey.id}/responses`, { answers: payload });
      onSubmitted();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const allAnswered = survey.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{survey.title}</h3>
          {survey.description && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>{survey.description}</p>}
          {survey.anonymous && <span className="badge badge-neutral" style={{ marginTop: 8 }}>Resposta anônima</span>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {survey.questions.map(q => (
          <div key={q.id}>
            <p style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 10 }}>{q.text}</p>
            {q.type === 'SCALE' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: 11 }, (_, i) => i).map(n => (
                  <button
                    key={n}
                    onClick={() => setAnswer(q.id, n)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: 38,
                      background: answers[q.id] === n ? 'var(--sage-700)' : undefined,
                      color: answers[q.id] === n ? '#FBF8F1' : undefined,
                      borderColor: answers[q.id] === n ? 'var(--sage-700)' : undefined,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'TEXT' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                placeholder="Sua resposta..."
              />
            )}
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="field">
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Sua escolha..."
                />
              </div>
            )}
          </div>
        ))}

        <button className="btn btn-primary" onClick={handleSubmit} disabled={!allAnswered || saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Enviando...' : 'Enviar respostas'}
        </button>
      </div>
    </div>
  );
}

export default function Surveys() {
  const { data: surveys, loading, error, refetch } = useApi('/surveys/available');
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(null);

  function handleSubmitted() {
    setJustSubmitted(activeSurvey?.id);
    refetch();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Pesquisas</h1>
          <p className="subtitle">Engajamento, clima organizacional e eNPS.</p>
        </div>
      </div>

      <div className="page-content">
        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {activeSurvey && (
          <SurveyForm survey={activeSurvey} onClose={() => setActiveSurvey(null)} onSubmitted={handleSubmitted} />
        )}

        {surveys && surveys.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhuma pesquisa disponível" description="Quando uma nova pesquisa for ativada pelo RH, ela aparecerá aqui." />
          </div>
        )}

        {surveys && surveys.length > 0 && !activeSurvey && (
          <div className="grid grid-2">
            {surveys.map(s => (
              <div className="card" key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, marginBottom: 4 }}><IconMessage style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />{s.title}</h3>
                    {s.description && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>{s.description}</p>}
                    <span className="badge badge-sage">{typeLabels[s.type]}</span>
                  </div>
                </div>
                {justSubmitted === s.id ? (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sage-700)', fontSize: 14 }}>
                    <IconCheck style={{ width: 16, height: 16 }} /> Respondida, obrigado!
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setActiveSurvey(s)}>Responder</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
