import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 380, padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div className="sidebar-brand-mark" style={{ background: 'var(--sage-500)', color: '#FBF8F1' }}>C</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Cultiva</div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Entrar</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20 }}>Acesse sua conta para continuar.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && <p style={{ fontSize: 13.5, color: 'var(--danger)' }}>{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 16 }}>
          Plataforma interna de pessoas — uso restrito.
        </p>
      </div>
    </div>
  );
}
