import React, { useState } from 'react';
import { DataStore } from '../../lib/dataStore';

type NewsCategory = 'all' | 'parliament' | 'court' | 'supreme_court' | 'president' | 'ministry' | 'system';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  userName: string;
}

const WriteStatementModal: React.FC<Props> = ({ isOpen, onClose, role, userName }) => {
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!headline || !body) return;
    setLoading(true);
    let category: NewsCategory = 'system';
    if (role === 'president') category = 'president';
    else if (role === 'ministry' || role === 'finance') category = 'ministry';
    else if (role === 'chief_justice' || role === 'justice') category = 'supreme_court';
    
    await DataStore.postNews({
      category,
      headline: `Statement: ${headline}`,
      body,
      priority: 'high',
      posted_by: `${userName} (${role.toUpperCase()})`,
    });
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '24px', width: '500px', maxWidth: '90%' }}>
        <h3 style={{ marginBottom: 16 }}>Write Public Statement</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Headline</label>
          <input type="text" className="input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Enter headline..." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Statement Body</label>
          <textarea className="input" rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Express your thoughts to the public..." />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>Publish to News</button>
        </div>
      </div>
    </div>
  );
};

export default WriteStatementModal;
