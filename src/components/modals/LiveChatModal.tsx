import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const LiveChatModal: React.FC = () => {
  const { chatModalOpen, setChatModalOpen, messages, sendChatMessage } = useApp();
  const { user, profile } = useAuth();
  const [activeChannel, setActiveChannel] = useState<'dispatch' | 'direction' | 'chauffeurs'>('dispatch');
  const [inputText, setInputText] = useState('');

  if (!chatModalOpen) return null;

  const filteredMessages = messages.filter((m) => m.channelId === activeChannel || !m.channelId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await sendChatMessage(inputText, activeChannel);
    setInputText('');
  };

  return (
    <div className="modal-backdrop open" style={{ display: 'flex', zIndex: 9999 }}>
      <div 
        className="modal"
        style={{
          width: '680px',
          maxWidth: '95vw',
          height: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}
      >
        <div className="modal-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: '#082b70' }}>📻 Messagerie & Live Dispatch (Radio de Bord)</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              Canal direct entre le bureau central de Delmas et les conducteurs en mission.
            </p>
          </div>
          <button type="button" className="close" onClick={() => setChatModalOpen(false)}>
            ✕
          </button>
        </div>

        {/* Channel Switcher */}
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
          <button
            type="button"
            className={activeChannel === 'dispatch' ? 'primary' : 'secondary'}
            onClick={() => setActiveChannel('dispatch')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            🎧 Dispatch & Secrétariat
          </button>
          <button
            type="button"
            className={activeChannel === 'chauffeurs' ? 'primary' : 'secondary'}
            onClick={() => setActiveChannel('chauffeurs')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            🚌 Radio Flotte Conducteurs
          </button>
          <button
            type="button"
            className={activeChannel === 'direction' ? 'primary' : 'secondary'}
            onClick={() => setActiveChannel('direction')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            👑 Avis Direction
          </button>
        </div>

        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', fontSize: '12px' }}>
              Aucun message dans ce canal pour le moment.
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isMe = m.senderId === user?.uid;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: isMe ? '#082b70' : '#f1f5f9',
                    color: isMe ? '#fff' : '#1e293b',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>
                    <strong>{m.senderName}</strong>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>{m.text}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Transmettre une consigne ou un rapport d'axe..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
          <button type="submit" className="primary" style={{ padding: '10px 18px' }}>
            Envoyer ➔
          </button>
        </form>
      </div>
    </div>
  );
};
