import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface DemandeEnvoiModalProps {
  data: {
    type: 'facture' | 'proforma';
    doc?: any;
  } | null;
  onClose: () => void;
}

export const DemandeEnvoiModal: React.FC<DemandeEnvoiModalProps> = ({ data, onClose }) => {
  const { requestDocumentSend, settings, factures, proformas, reservations } = useApp();
  const { user, profile } = useAuth();

  const type = data?.type || 'facture';
  const initialDoc = data?.doc;
  const isFacture = type === 'facture';
  const clientName = profile?.nom || profile?.name || user?.displayName || initialDoc?.client || 'Client';

  const defaultEmail = user?.email || profile?.email || initialDoc?.clientEmail || '';
  const defaultPhone = profile?.telephone || profile?.phone || initialDoc?.telephone || '';

  // Candidates for selection if opened generally from the dashboard
  const candidateDocs = isFacture ? factures : proformas;

  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDoc?.id || initialDoc?.number || (candidateDocs.length > 0 ? candidateDocs[0].id : (reservations.length > 0 ? reservations[0].id : 'custom'))
  );
  const [customRef, setCustomRef] = useState<string>('');
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDoc?.id || initialDoc?.number) {
      setSelectedDocId(initialDoc.id || initialDoc.number);
    }
  }, [initialDoc]);

  if (!data) return null;

  // Resolve current document info
  let activeDoc = initialDoc;
  if (!activeDoc && selectedDocId !== 'custom') {
    activeDoc = candidateDocs.find(d => d.id === selectedDocId || d.number === selectedDocId);
    if (!activeDoc) {
      activeDoc = reservations.find(r => r.id === selectedDocId);
    }
  }

  const docNumber = activeDoc?.number || activeDoc?.id || customRef || (isFacture ? 'Facture générale' : 'Devis général');
  const amount = activeDoc?.totalTTC || activeDoc?.amount || 0;
  const currency = activeDoc?.currency || 'USD';
  const service = activeDoc?.service || 'Prestation de transport VIP Laperle Tour';

  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendEmail && !sendWhatsApp) {
      alert('Veuillez sélectionner au moins un canal de réception (Email ou WhatsApp).');
      return;
    }
    setLoading(true);
    const method = sendEmail && sendWhatsApp ? 'both' : sendEmail ? 'email' : 'whatsapp';
    const notesDetail = `Destinataires -> Email : ${email || 'Non fourni'} | WhatsApp : ${phone || 'Non fourni'}${customRef ? ` | Réf : ${customRef}` : ''}${note ? ` | Note client : ${note}` : ''}`;

    await requestDocumentSend(type, docNumber, amount, method, notesDetail);
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2400);
  };

  const handleOpenWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Bonjour l'équipe support Laperle Tour,\n` +
      `Je suis ${clientName}.\n` +
      `Je sollicite l'envoi de ma ${isFacture ? 'facture officielle' : 'proforma (devis)'} (${docNumber}) d'un montant de $${amount} ${currency}.\n` +
      (email ? `Adresse email de réception : ${email}\n` : '') +
      (note ? `Précisions : ${note}\n` : '') +
      `Merci pour votre réactivité !`
    );
    const cleanNum = officialWhatsApp.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '540px', width: '100%', borderRadius: '16px' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>{isFacture ? '🧾' : '📋'}</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#082b70' }}>
                Demander {isFacture ? 'une Facture' : 'un Devis'} à l'équipe Support
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
              Notre équipe support et comptabilité vous transmettra immédiatement votre document officiel par email et sur WhatsApp.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose} 
            style={{ fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#94a3b8' }}
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto' }}>
              ✓
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '0 0 8px 0' }}>
              Demande transmise au support !
            </h4>
            <p style={{ fontSize: '13.5px', color: '#475569', maxWidth: '380px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
              L'équipe Laperle Tour a bien reçu votre demande pour <strong>{docNumber}</strong> et vous adressera le document dans les plus brefs délais.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#f8fafc', padding: '6px 14px', borderRadius: '20px', color: '#64748b' }}>
              <span>Fermeture automatique...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* If no initialDoc was fixed, allow selecting among invoices/reservations */}
            {!initialDoc && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Sélectionnez le document ou la prestation concernée :
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {candidateDocs.length > 0 && (
                    <optgroup label={isFacture ? 'Mes Factures Existantes' : 'Mes Devis Existants'}>
                      {candidateDocs.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.number || d.id} — ${(d.totalTTC || d.amount || 0).toLocaleString()} {d.currency || 'USD'} ({d.service || (isFacture ? 'Facture' : 'Devis')})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {reservations.length > 0 && (
                    <optgroup label="Mes Réservations & Trajets">
                      {reservations.map(r => (
                        <option key={r.id} value={r.id}>
                          Course {r.id} : {r.origin || 'Départ'} ➔ {r.destination || 'Arrivée'} (${r.amount || 0} USD)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="custom">Autre / Demande générale de facture</option>
                </select>
              </div>
            )}

            {/* Custom Reference Input if selected */}
            {selectedDocId === 'custom' && (
              <div className="field" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  Précisez la date, le trajet ou la référence de la course :
                </label>
                <input
                  type="text"
                  value={customRef}
                  onChange={(e) => setCustomRef(e.target.value)}
                  placeholder="Ex: Trajet du 20 octobre dernier Aéroport ➔ Hôtel Karibe"
                  required={selectedDocId === 'custom'}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            )}

            {/* Document summary box */}
            <div 
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748b' }}>
                  DOCUMENT SÉLECTIONNÉ
                </div>
                <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#082b70' }}>
                  {isFacture ? 'Facture' : 'Devis'} : {docNumber}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                  {service}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748b' }}>
                  MONTANT ESTIMÉ
                </div>
                <div style={{ fontSize: '17px', fontWeight: 850, color: '#15803d' }}>
                  ${amount.toLocaleString()} {currency}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {activeDoc?.status ? `Statut : ${activeDoc.status}` : 'Support Laperle'}
                </div>
              </div>
            </div>

            {/* Channels selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                Canaux de réception souhaités :
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: sendEmail ? '2px solid #082b70' : '1px solid #cbd5e1',
                    background: sendEmail ? '#f0f5ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={sendEmail} 
                    onChange={(e) => setSendEmail(e.target.checked)} 
                    style={{ accentColor: '#082b70', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#082b70' }}>📧 Par Email</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Format PDF officiel DGI</div>
                  </div>
                </label>

                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: sendWhatsApp ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: sendWhatsApp ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={sendWhatsApp} 
                    onChange={(e) => setSendWhatsApp(e.target.checked)} 
                    style={{ accentColor: '#16a34a', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>💬 Sur WhatsApp</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Lien direct & échange support</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Destination inputs */}
            {sendEmail && (
              <div className="field" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  Adresse Email de réception :
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  required={sendEmail}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            )}

            {sendWhatsApp && (
              <div className="field" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  Numéro WhatsApp de réception :
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+509 XXXX XXXX"
                  required={sendWhatsApp}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            )}

            <div className="field" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Précision pour le support (Optionnel) :
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Merci d'adresser la facture au nom de mon entreprise ou avec mention acquittée..."
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', resize: 'vertical' }}
              />
            </div>

            {/* Submit & WhatsApp buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#082b70',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  fontSize: '13.5px',
                  fontWeight: 750,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(8, 43, 112, 0.2)'
                }}
              >
                {loading ? 'Transmission en cours...' : `🚀 Transmettre ma demande de ${isFacture ? 'facture' : 'devis'} au support`}
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppDirect}
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                💬 Demander directement sur WhatsApp ({officialWhatsApp})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
