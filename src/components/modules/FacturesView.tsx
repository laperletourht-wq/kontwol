import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Facture } from '../../types';

interface FacturesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const FacturesView: React.FC<FacturesViewProps> = ({ onOpenModal }) => {
  const { 
    factures, 
    deleteFacture, 
    saveFacture, 
    setPrintSheetData, 
    globalSearchQuery,
    convertFactureToPaiement
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = factures.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchClient = f.client?.toLowerCase().includes(effectiveSearch);
      const matchNum = f.number?.toLowerCase().includes(effectiveSearch);
      const matchProf = f.proformaNumber?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchNum || matchProf;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Payée': return 'green';
      case 'En retard': return 'red';
      case 'Partiellement payée': return 'orange';
      default: return 'orange';
    }
  };

  const sendWhatsAppReminder = (f: Facture) => {
    const text = encodeURIComponent(
      `Bonjour ${f.client},\n` +
      `Ceci est un rappel amical de LAPERLE TOUR HT concernant la facture officielle N° ${f.number} d'un montant de $${f.amount} ${f.currency || 'USD'}.\n` +
      `Date limite de règlement : ${f.dueDate || 'Immédiat'}.\n` +
      `Merci pour votre confiance !`
    );
    window.open(`https://wa.me/50944408687?text=${text}`, '_blank');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Factures & Règlements' : 'Factures Officielles & Recouvrement'}</h2>
          <p>
            {isClient
              ? 'Consultez l\'historique de vos factures, soldes et états de règlement.'
              : 'Gestion comptable, encaissements et émission des factures conformes DGI.'}
          </p>
        </div>
        <div className="actions">
          {!isClient && !isChauffeur && (
            <button type="button" className="primary" onClick={() => onOpenModal('facture')}>
              + Nouvelle Facture
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par facture, client ou proforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tous les statuts</option>
            <option value="Payée">Payée</option>
            <option value="En attente">En attente</option>
            <option value="En retard">En retard</option>
            <option value="Annulée">Annulée</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Réf. Proforma</th>
                <th>Client</th>
                <th>Date d'émission</th>
                <th>Échéance</th>
                <th>Montant Total</th>
                <th>Mode Paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.number}</strong></td>
                    <td>{f.proformaNumber ? <span className="badge">{f.proformaNumber}</span> : '-'}</td>
                    <td><strong>{f.client}</strong></td>
                    <td>{f.date}</td>
                    <td>{f.dueDate || '-'}</td>
                    <td>
                      <strong style={{ color: '#082b70' }}>
                        ${f.amount.toLocaleString()} {f.currency || 'USD'}
                      </strong>
                    </td>
                    <td>{f.paymentMethod || 'Non spécifié'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny"
                          onClick={() => setPrintSheetData({ type: 'facture', data: f })}
                          title="Imprimer / Télécharger PDF officiel"
                        >
                          🖨️ Imprimer
                        </button>
                        {f.status !== 'Payée' ? (
                          <>
                            <button
                              type="button"
                              className="tiny"
                              style={{ background: '#ecfdf5', color: '#047857', fontWeight: 600, border: '1px solid #a7f3d0' }}
                              onClick={() => convertFactureToPaiement(f)}
                              title="Encaisser immédiatement la facture en caisse (1-clic)"
                            >
                              ⚡ Encaisser Direct
                            </button>
                            <button
                              type="button"
                              className="tiny edit"
                              onClick={() => onOpenModal('paiement', {
                                client: f.client,
                                montant: f.amount,
                                devise: f.currency || 'USD',
                                factureAssociee: f.number,
                                motif: `Règlement facture ${f.number}`
                              })}
                              title="Encaisser avec mode de paiement personnalisé"
                            >
                              💵 Mode
                            </button>
                            <button
                              type="button"
                              className="tiny"
                              onClick={() => sendWhatsAppReminder(f)}
                              title="Envoyer un rappel WhatsApp au client"
                            >
                              💬 Relance
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            ✓ Soldée
                          </span>
                        )}
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('facture', f)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer la facture ${f.number} ?`)) {
                              deleteFacture(f.id);
                            }
                          }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
