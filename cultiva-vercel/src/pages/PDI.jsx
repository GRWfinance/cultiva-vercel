import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconCompass, IconPlus, IconCheck, IconClock, IconX } from '../components/Icons';

const categoryLabels = {
  SKILL: { label: 'Habilidade', cls: 'badge-sage' },
  KNOWLEDGE: { label: 'Conhecimento', cls: 'badge-gold' },
  BEHAVIOR: { label: 'Comportamento', cls: 'badge-terra' },
  CAREER: { label: 'Carreira', cls: 'badge-neutral' },
  EXPERIENCE: { label: 'Experiência', cls: 'badge-sage' },
};

const statusLabels = {
  DRAFT: { label: 'Rascunho', cls: 'badge-neutral' },
  IN_PROGRESS: { label: 'Em andamento', cls: 'badge-gold' },
  COMPLETED: { label: 'Concluído', cls: 'badge-sage' },
  CANCELLED: { label: 'Cancelado', cls: 'badge-terra' },
};

const goalStatusIcon = {
  PENDING: <IconClock style={{ width: 16, height: 16, color: 'var(--ink-faint)' }} />,
  IN_PROGRESS: <IconClock style={{ width: 16, height: 16, color: 'var(--gold-500)' }} />,
  DONE: <IconCheck style={{ width: 16, height: 16, color: 'var(--sage-500)' }} />,
  CANCELLED: <IconX style={{ width: 16, height: 16, color: 'var(--ink-faint)' }} />,
};

function GoalRow({ goal, onUpdated }) {
  const [progress, setProgress] = useState(goal.progress);

  async function handleSave() {
    try {
      await api.patch(`/pdis/goals/${goal.id}`, { progress: Number(progress) });
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="list-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div className="list-row-main">
        {goalStatusIcon[goal.status]}
        <div style={{ flex: 1 }}>
          <div className="list-row-title">{goal.title}</div>
          {goal.description && <div className="list-row-subtitle">{goal.description}</div>}
          <div className="list-row-subtitle" style={{ marginTop: 2 }}>
            {goal.targetDate && `Prazo: ${new Date(goal.targetDate).toLocaleDateString('pt-BR')} · `}
            <span className={`badge ${categoryLabels[goal.category]?.cls}`} style={{ marginLeft: 4 }}>{categoryLabels[goal.category]?.label}</span>
          </div>
        </div>
      </div>
      <div className="wallet-card-bar-track">
        <div className="wallet-card-bar-fill" style={{ width: `${goal.progress}%` }} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="range" min="0" max="100" step="5"
          value={progress}
          onChange={e => setProgress(e.target.value)}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, width: 40 }}>{progress}%</span>
        <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={Number(progress) === goal.progress}>Salvar</button>
      </div>
    </div>
  );
}

export default function PDIPage() {
  const { data: pdis, loading, error, refetch } = useApi('/pdis');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>PDI</h1>
          <p className="subtitle">Planos de desenvolvimento individual e acompanhamento de metas.</p>
        </div>
        <button className="btn btn-primary"><IconPlus style={{ width: 16, height: 16 }} /> Novo PDI</button>
      </div>

      <div className="page-content">
        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {pdis && pdis.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhum PDI criado" description="Crie um plano de desenvolvimento para começar a acompanhar suas metas de crescimento." />
          </div>
        )}

        {pdis?.map(pdi => (
          <div className="card" key={pdi.id}>
            <div className="card-header">
              <div>
                <h3><IconCompass style={{ width: 16, height: 16, verticalAlign: -2, marginRight: 6 }} />{pdi.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  Ciclo {pdi.cycle} {pdi.manager && `· Gestor: ${pdi.manager.name}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${statusLabels[pdi.status]?.cls}`}>{statusLabels[pdi.status]?.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{pdi.overallProgress}%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>concluído</div>
                </div>
              </div>
            </div>
            <div className="list">
              {pdi.goals.map(g => <GoalRow key={g.id} goal={g} onUpdated={refetch} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
