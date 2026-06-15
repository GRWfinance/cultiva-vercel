import React, { useState } from 'react';
import { useApi } from '../api/useApi';
import { api } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { IconAward, IconHeart, IconPlus } from '../components/Icons';

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function NewKudosForm({ onClose, onCreated }) {
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [values, setValues] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/kudos', {
        receiverId,
        message,
        values: values.split(',').map(v => v.trim()).filter(Boolean),
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
        <h3>Novo elogio</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>ID do colaborador (destinatário)</label>
          <input type="text" required value={receiverId} onChange={e => setReceiverId(e.target.value)} placeholder="uuid do usuário" />
        </div>
        <div className="field">
          <label>Mensagem</label>
          <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="O que essa pessoa fez de especial?" />
        </div>
        <div className="field">
          <label>Valores relacionados (separados por vírgula)</label>
          <input type="text" value={values} onChange={e => setValues(e.target.value)} placeholder="Colaboração, Inovação" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Enviando...' : 'Enviar elogio'}
        </button>
      </form>
    </div>
  );
}

export default function Kudos() {
  const { data: kudos, loading, error, refetch } = useApi('/kudos');
  const { data: stats } = useApi('/kudos/stats');
  const [showForm, setShowForm] = useState(false);

  async function handleLike(id) {
    try {
      await api.post(`/kudos/${id}/like`);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Elogios</h1>
          <p className="subtitle">Mural de reconhecimento e kudos entre colegas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus style={{ width: 16, height: 16 }} /> Novo elogio
        </button>
      </div>

      <div className="page-content">
        {showForm && <NewKudosForm onClose={() => setShowForm(false)} onCreated={refetch} />}

        {stats && stats.totalKudos > 0 && (
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header"><h3>Valores mais reconhecidos</h3></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stats.topValues.map(v => (
                  <span key={v.value} className="badge badge-gold">{v.value} · {v.count}</span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Mais reconhecidos</h3></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stats.topReceivers.map(r => (
                  <span key={r.name} className="badge badge-sage">{r.name} · {r.count}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {kudos && kudos.length === 0 && (
          <div className="card">
            <EmptyState title="Nenhum elogio ainda" description="Seja o primeiro a reconhecer um colega!" />
          </div>
        )}

        {kudos && kudos.length > 0 && (
          <div className="grid grid-2">
            {kudos.map(k => (
              <div className="card" key={k.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(k.sender?.name)}</div>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>→</span>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--terra-100)', color: 'var(--terra-700)' }}>{initials(k.receiver?.name)}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-soft)' }}>{formatDate(k.createdAt)}</div>
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                  <strong style={{ fontWeight: 500 }}>{k.sender?.name}</strong> elogiou <strong style={{ fontWeight: 500 }}>{k.receiver?.name}</strong>: "{k.message}"
                </p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {k.values.map(v => <span key={v} className="badge badge-gold">{v}</span>)}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleLike(k.id)}>
                    <IconHeart style={{ width: 14, height: 14 }} /> {k.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
