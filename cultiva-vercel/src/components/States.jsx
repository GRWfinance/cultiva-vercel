import React from 'react';
import { IconAlertCircle } from './Icons';

export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="empty-state">
      <p style={{ color: 'var(--ink-soft)' }}>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state">
      <div style={{ color: 'var(--terra-500)', marginBottom: 8 }}>
        <IconAlertCircle style={{ width: 28, height: 28, margin: '0 auto' }} />
      </div>
      <p style={{ marginBottom: 12 }}>{message || 'Não foi possível carregar os dados.'}</p>
      {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <h3 style={{ marginBottom: 6, fontSize: 16 }}>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
