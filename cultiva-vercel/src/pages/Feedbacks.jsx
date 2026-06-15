import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconPlus, IconLock, IconUsers, IconMessage } from '../components/Icons';

const typeLabels = {
  POSITIVE: { label: 'Positivo', cls: 'badge-sage' },
  CONSTRUCTIVE: { label: 'Construtivo', cls: 'badge-gold' },
  REQUEST: { label: 'Pedido', cls: 'badge-neutral' },
};

const visibilityIcon = {
  PRIVATE: <IconLock style={{ width: 13, height: 13 }} />,
  MANAGER: <IconUsers style={{ width: 13, height: 13 }} />,
  PUBLIC: <IconMessage style={{ width: 13, height: 13 }} />,
};

const visibilityLabel = {
  PRIVATE: 'Privado',
  MANAGER: 'Visível ao gestor',
  PUBLIC: 'Mural público',
};

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function NewFeedbackForm({ onClose, onCreated }) {
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('POSITIVE');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [competencies, setCompetencies] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/feedbacks', {
        receiverId,
        content,
        type,
        visibility,
        isAnonymous,
        competencies: competencies.split(',').map(c => c.trim()).filter(Boolean),
      });
      onCreated();
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
        <h3>Enviar feedback</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>ID do destinatário</label>
          <input type="text" required value={receiverId} onChange={e => setReceiverId(e.target.value)} placeholder="uuid do usuário" />
        </div>
        <div className="field">
          <label>Mensagem</label>
          <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva seu feedback..." />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="POSITIVE">Positivo</option>
              <option value="CONSTRUCTIVE">Construtivo</option>
              <option value="REQUEST">Pedido</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Visibilidade</label>
            <select value={visibility} onChange={e => setVisibility(e.target.value)}>
              <option value="PRIVATE">Privado</option>
              <option value="MANAGER">Visível ao gestor</option>
              <option value="PUBLIC">Mural público</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Competências (separadas por vírgula)</label>
          <input type="text" value={competencies} onChange={e => setCompetencies(e.target.value)} placeholder="Comunicação, Execução" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
          Enviar anonimamente
        </label>
        <button className="btn btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </form>
    </div>
  );
}

export default function Feedbacks() {
  const [tab, setTab] = useState('received');
  const [showForm, setShowForm] = useState(false);

  const { data: received, loading: l1, error: e1, refetch: r1 } = useApi('/feedbacks/received', { enabled: tab === 'received' });
  const { data: mural, loading: l2, error: e2, refetch: r2 } = useApi('/feedbacks/public', { enabled: tab === 'mural' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Feedbacks</h1>
          <p className="subtitle">Cultura de feedback contínuo - envie, receba e acompanhe.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus style={{ width: 16, height: 16 }} /> Enviar feedback
        </button>
      </div>

      <div className="page-content">
        {showForm && <NewFeedbackForm onClose={() => setShowForm(false)} onCreated={() => { r1(); r2(); }} />}

        <div className="tabs">
          <div className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')} style={{ cursor: 'pointer' }}>Recebidos</div>
          <div className={`tab ${tab === 'mural' ? 'active' : ''}`} onClick={() => setTab('mural')} style={{ cursor: 'pointer' }}>Mural da equipe</div>
        </div>

        {tab === 'received' && (
          <>
            {l1 && <Loading />}
            {e1 && <ErrorState message={e1} onRetry={r1} />}
            {received && received.length === 0 && (
              <div className="card"><EmptyState title="Nenhum feedback recebido" description="Feedbacks recebidos de colegas e gestores aparecerão aqui." /></div>
            )}
            {received && received.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {received.map(f => (
                  <div className="card" key={f.id}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div className="avatar">
                        {f.isAnonymous || !f.sender ? '?' : initials(f.sender.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>
                              {f.isAnonymous || !f.sender ? 'Feedback anônimo' : f.sender.name}
                            </p>
                            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>{formatDate(f.createdAt)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span className={`badge ${typeLabels[f.type]?.cls}`}>{typeLabels[f.type]?.label}</span>
                            <span className="badge badge-neutral">{visibilityIcon[f.visibility]} {visibilityLabel[f.visibility]}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 14.5, marginTop: 12, lineHeight: 1.65 }}>{f.content}</p>
                        {f.competencies?.length > 0 && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                            {f.competencies.map(c => <span key={c} className="badge badge-neutral">{c}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'mural' && (
          <>
            {l2 && <Loading />}
            {e2 && <ErrorState message={e2} onRetry={r2} />}
            {mural && mural.length === 0 && (
              <div className="card"><EmptyState title="Mural vazio" description="Feedbacks públicos aparecerão aqui." /></div>
            )}
            {mural && mural.length > 0 && (
              <div className="grid grid-2">
                {mural.map(f => (
                  <div className="card" key={f.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{f.sender ? initials(f.sender.name) : '?'}</div>
                      <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>→</span>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--terra-100)', color: 'var(--terra-700)' }}>{initials(f.receiver?.name)}</div>
                      <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-soft)' }}>{formatDate(f.createdAt)}</div>
                    </div>
                    <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>"{f.content}"</p>
                    <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                      {f.competencies?.map(c => <span key={c} className="badge badge-sage">{c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
