import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface EditModalProps {
  type: string | null;
  data: any;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ type, data, onClose }) => {
  const { user, profile, role, isSuperAdmin, updateUserRoleAndZones } = useAuth();
  const isClientUser = role === 'client' || role === 'prospect';

  const { 
    saveReservation, 
    saveProforma, 
    saveFacture, 
    saveClient, 
    saveEleve, 
    saveAbonnement, 
    saveVehicule, 
    saveChauffeur, 
    savePlanning, 
    savePaiement,
    showToast,
    addNotification,
    settings,
    clients,
    vehicules,
    chauffeurs,
    reservations,
    proformas,
    factures,
    setChatModalOpen
  } = useApp();

  const isReservationLockedForClient = Boolean(
    isClientUser && data?.id && data.status && data.status !== 'En attente' && data.status !== 'Brouillon'
  );

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const initial = data ? { ...data } : {};
    if (!data?.id && isClientUser) {
      if (!initial.client) initial.client = profile?.nom || profile?.name || user?.displayName || '';
      if (!initial.telephone) initial.telephone = profile?.telephone || profile?.phone || '';
      if (!initial.email) initial.email = user?.email || profile?.email || '';
      if (!initial.clientEmail) initial.clientEmail = user?.email || profile?.email || '';
      if (!initial.clientId) initial.clientId = user?.uid || profile?.id || '';
    }
    setFormData(initial);
  }, [data, isClientUser, profile, user]);

  if (!type) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (type === 'facture' && isClientUser) {
        showToast('Les clients ne peuvent pas créer de factures.', 'error');
        onClose();
        return;
      }

      if (type === 'reservation' && isReservationLockedForClient) {
        showToast('Ce dossier a été validé par le secrétariat et ne peut plus être modifié par le client. Contactez la secrétaire.', 'error');
        onClose();
        return;
      }

      if (type === 'demande-devis' || (type === 'proforma' && isClientUser)) {
        const clientName = formData.client || profile?.nom || profile?.name || user?.displayName || 'Client';
        const clientEmail = formData.email || formData.clientEmail || user?.email || profile?.email || '';
        const clientPhone = formData.telephone || profile?.telephone || profile?.phone || '';
        const service = formData.service || 'Transfert VIP / Course Privée';
        const resId = `DEM-${Date.now().toString().slice(-6)}`;
        
        await saveReservation({
          ...formData,
          id: resId,
          client: clientName,
          clientId: user?.uid || profile?.id || '',
          email: clientEmail,
          telephone: clientPhone,
          service,
          date: formData.date || new Date().toISOString().slice(0, 10),
          time: formData.time || '09:00',
          origin: formData.origin || 'Port-au-Prince',
          destination: formData.destination || 'À définir',
          passengers: Number(formData.passengers) || 1,
          amount: Number(formData.amount) || 0,
          currency: 'USD',
          status: 'En attente',
          demandeDevis: true,
          notes: formData.specialRequests 
            ? `Demande de devis client : ${formData.specialRequests}` 
            : (formData.notes || 'Demande de devis en attente de chiffrage par le secrétariat')
        });

        await addNotification({
          title: `Nouvelle demande de devis : ${service}`,
          message: `${clientName} (${clientEmail} / ${clientPhone}) demande un chiffrage pour ${formData.origin || 'Port-au-Prince'} ➔ ${formData.destination || 'Destination'}.`,
          type: 'info',
          link: 'reservations',
          targetId: resId,
          targetAudience: 'admin',
          authorUid: user?.uid
        });

        showToast('Votre demande de devis a bien été transmise à notre équipe commerciale !', 'success');
        onClose();
        return;
      }

      switch (type) {
        case 'reservation':
          const isNewReservation = !formData.id;
          const assignedId = formData.id || `RES-${Date.now().toString().slice(-6)}`;
          const assignedDossierId = formData.dossierId || (formData.id ? formData.dossierId || formData.id : `DOS-${assignedId.slice(4)}`);
          const rClientName = isClientUser ? (profile?.nom || profile?.name || user?.displayName || formData.client || 'Client') : (formData.client || 'Client Divers');
          const rEmail = isClientUser ? (user?.email || profile?.email || formData.email) : formData.email;
          const rPhone = isClientUser ? (profile?.telephone || profile?.phone || formData.telephone) : formData.telephone;

          await saveReservation({
            ...formData,
            id: assignedId,
            dossierId: assignedDossierId,
            client: rClientName,
            clientId: isClientUser ? (user?.uid || profile?.id) : formData.clientId,
            telephone: rPhone,
            email: rEmail,
            status: isClientUser ? 'En attente' : (formData.status || 'En attente'),
            trajet: formData.trajet || 'Aller simple',
            passengers: Number(formData.passengers) || 1,
            amount: Number(formData.amount) || 0,
            currency: formData.currency || 'USD'
          });

          if (isNewReservation && isClientUser) {
            await addNotification({
              title: `Nouvelle réservation client N° ${assignedId}`,
              message: `${rClientName} (${rPhone}) a réservé : ${formData.origin || 'Port-au-Prince'} ➔ ${formData.destination || 'Destination'} le ${formData.date || 'date à définir'}.`,
              type: 'info',
              link: 'reservations',
              targetId: assignedId,
              targetAudience: 'admin',
              authorUid: user?.uid
            });
          }
          break;
        case 'proforma': {
          const pAmount = Number(formData.amount) || 0;
          const tva = Math.round(pAmount * (settings.tvaPourcentage / 100));
          const proNum = formData.number || `PRO-${Date.now().toString().slice(-6)}`;
          const pDossierId = formData.dossierId || (formData.reservationId ? reservations.find(r => r.id === formData.reservationId)?.dossierId || formData.reservationId : undefined) || proNum;
          
          await saveProforma({
            ...formData,
            id: proNum,
            number: proNum,
            dossierId: pDossierId,
            amount: pAmount,
            tva,
            totalTTC: pAmount + tva,
            status: formData.status || 'En attente'
          });

          if (formData.reservationId) {
            const linkedRes = reservations.find(r => r.id === formData.reservationId);
            if (linkedRes) {
              await saveReservation({
                ...linkedRes,
                devisRef: proNum,
                proformaRef: proNum,
                status: 'Devis émis',
                updatedAt: new Date().toISOString()
              });
            }
          }
          break;
        }
        case 'facture': {
          const facNum = formData.number || `FAC-${Date.now().toString().slice(-6)}`;
          const fDossierId = formData.dossierId || 
            (formData.reservationId ? reservations.find(r => r.id === formData.reservationId)?.dossierId : undefined) ||
            (formData.proformaNumber ? proformas.find(p => p.number === formData.proformaNumber)?.dossierId : undefined) ||
            facNum;

          await saveFacture({
            ...formData,
            id: facNum,
            number: facNum,
            dossierId: fDossierId,
            amount: Number(formData.amount) || 0,
            status: formData.status || 'En attente'
          });

          if (formData.proformaNumber) {
            const linkedPro = proformas.find(p => p.number === formData.proformaNumber);
            if (linkedPro) {
              await saveProforma({
                ...linkedPro,
                status: 'Convertie en facture',
                factureNumber: facNum,
                updatedAt: new Date().toISOString()
              });
            }
          }

          if (formData.reservationId) {
            const linkedRes = reservations.find(r => r.id === formData.reservationId);
            if (linkedRes) {
              await saveReservation({
                ...linkedRes,
                factureRef: facNum,
                status: 'Facturé',
                demandeFacture: false,
                updatedAt: new Date().toISOString()
              });
            }
          }
          break;
        }
        case 'client':
          await saveClient(formData);
          break;
        case 'eleve':
          await saveEleve({
            ...formData,
            fraisMensuel: Number(formData.fraisMensuel) || 150,
            statut: formData.statut || 'Actif'
          });
          break;
        case 'abonnement':
          await saveAbonnement({
            ...formData,
            tarifMensuel: Number(formData.tarifMensuel) || 150,
            statut: formData.statut || 'Actif'
          });
          break;
        case 'vehicule':
          await saveVehicule({
            ...formData,
            annee: Number(formData.annee) || 2024,
            capacitePassagers: Number(formData.capacitePassagers) || 5,
            statut: formData.statut || 'Disponible',
            climatisation: formData.climatisation !== false,
            gpsActif: formData.gpsActif !== false
          });
          break;
        case 'chauffeur':
          await saveChauffeur({
            ...formData,
            statut: formData.statut || 'En service',
            noteService: Number(formData.noteService) || 5.0
          });
          break;
        case 'planning':
          await savePlanning({
            ...formData,
            passagers: Number(formData.passagers) || 1,
            statut: formData.statut || 'Programmé'
          });
          break;
        case 'paiement':
          await savePaiement({
            ...formData,
            reference: formData.reference || `PAY-${Date.now().toString().slice(-6)}`,
            montant: Number(formData.montant) || 0,
            date: formData.date || new Date().toISOString().slice(0, 10),
            devise: formData.devise || 'USD',
            modePaiement: formData.modePaiement || 'MonCash',
            statut: formData.statut || 'Validé',
            dossierId: formData.dossierId,
            clientId: formData.clientId
          });
          break;
        case 'utilisateur': {
          if (role !== 'admin' && !isSuperAdmin) {
            showToast("Seul l'administrateur peut créer ou modifier des comptes utilisateurs.", 'error');
            return;
          }
          const targetId = formData.id || formData.uid || `usr-${Date.now().toString().slice(-6)}`;
          const userRole = (formData.role as UserRole) || 'client';
          const allowedModules = formData.allowedModules || (ROLE_PERMISSIONS[userRole] || ['reservations']);
          await updateUserRoleAndZones(targetId, userRole, allowedModules, formData.status || 'actif');
          showToast(`Compte de ${formData.nom || formData.email} enregistré avec succès`, 'success');
          break;
        }
        default:
          break;
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la sauvegarde.', 'error');
    }
  };

  const getTitle = () => {
    if (type === 'demande-devis' || (type === 'proforma' && isClientUser)) {
      return 'Demander un Devis Personnalisé';
    }
    const isEdit = Boolean(data?.id);
    switch (type) {
      case 'reservation': return isEdit ? 'Modifier la Réservation' : isClientUser ? 'Réserver un Trajet avec Chauffeur' : 'Nouvelle Réservation';
      case 'proforma': return isEdit ? 'Modifier le Devis Proforma' : 'Émettre un Devis Proforma';
      case 'facture': return isEdit ? 'Modifier la Facture' : 'Émettre une Facture';
      case 'client': return isEdit ? 'Modifier le Client' : 'Nouveau Client';
      case 'eleve': return isEdit ? 'Modifier l\'Élève' : 'Inscrire un Élève (Navette)';
      case 'abonnement': return isEdit ? 'Modifier l\'Abonnement' : 'Nouvel Abonnement';
      case 'vehicule': return isEdit ? 'Modifier le Véhicule' : 'Ajouter un Véhicule';
      case 'chauffeur': return isEdit ? 'Modifier le Chauffeur' : 'Nouveau Chauffeur';
      case 'planning': return isEdit ? 'Modifier le Trajet' : 'Programmer un Trajet';
      case 'paiement': return isEdit ? 'Modifier le Paiement' : 'Encaisser un Paiement';
      case 'utilisateur': return 'Gestion du Compte Utilisateur';
      default: return 'Formulaire';
    }
  };

  return (
    <div className="modal-backdrop open" style={{ display: 'flex', zIndex: 9999 }}>
      <div className="modal">
        <div className="modal-head">
          <h2>{getTitle()}</h2>
          <button type="button" className="close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* RESERVATION FORM */}
          {type === 'reservation' && (
            <div className="form-grid">
              {isReservationLockedForClient && (
                <div className="field full" style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔒</span> Dossier Validé · Modifications Verrouillées
                  </div>
                  <div>
                    Cette réservation a déjà été validée par notre secrétariat (Statut : <strong>{data?.status}</strong>). Conformément aux règles de sécurité, les documents validés ne peuvent plus être modifiés directement par le client. Pour tout ajustement d&apos;horaire ou d&apos;itinéraire, veuillez contacter directement votre secrétaire via la messagerie ou WhatsApp.
                  </div>
                </div>
              )}

              <div className="field">
                <label>Nom du Client :</label>
                {isClientUser ? (
                  <input
                    type="text"
                    value={formData.client || profile?.nom || profile?.name || user?.displayName || 'Client'}
                    readOnly
                    disabled={isReservationLockedForClient}
                    style={{ background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      list="clients-list-reservation"
                      value={formData.client || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange('client', val);
                        const match = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
                        if (match) {
                          if (match.id) handleChange('clientId', match.id);
                          if (match.telephone) handleChange('telephone', match.telephone);
                          if (match.email) handleChange('email', match.email);
                        }
                      }}
                      placeholder="Sélectionnez ou tapez le nom du client"
                      required
                    />
                    <datalist id="clients-list-reservation">
                      {clients.map(c => (
                        <option key={c.id} value={c.name}>{c.telephone ? `${c.telephone} - ${c.type || 'Client'}` : ''}</option>
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              {!isClientUser && (
                <div className="field">
                  <label>Numéro de Dossier Unique :</label>
                  <input
                    type="text"
                    value={formData.dossierId || (formData.id ? formData.dossierId || formData.id : 'Attribution automatique (DOS-...)')}
                    readOnly
                    style={{ background: '#f8fafc', color: '#082b70', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              )}

              <div className="field">
                <label>Téléphone Client :</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 4440 8687"
                  disabled={isReservationLockedForClient}
                />
              </div>

              <div className="field">
                <label>Prestation Souhaitée :</label>
                <select
                  value={formData.service || 'Circuit Touristique & Découverte'}
                  onChange={(e) => handleChange('service', e.target.value)}
                  disabled={isReservationLockedForClient}
                >
                  <option value="Circuit Touristique & Découverte">Circuit Touristique & Découverte</option>
                  <option value="Location SUV / Berline VIP avec Chauffeur">Location SUV VIP avec Chauffeur</option>
                  <option value="Abonnement Transport Scolaire Sécurisé">Abonnement Transport Scolaire</option>
                  <option value="Transfert Aéroport Toussaint Louverture">Transfert Aéroport</option>
                  <option value="Transport Corporate & Missions d'Entreprise">Transport Corporate</option>
                  <option value="Course Privée Urbaine & Taxi VIP">Course Privée Taxi VIP</option>
                </select>
              </div>

              <div className="field">
                <label>Type de Trajet :</label>
                <select
                  value={formData.trajet || 'Aller simple'}
                  onChange={(e) => handleChange('trajet', e.target.value)}
                  disabled={isReservationLockedForClient}
                >
                  <option value="Aller simple">Aller simple</option>
                  <option value="Aller-retour">Aller-retour</option>
                </select>
              </div>

              <div className="field">
                <label>Nombre de Passagers :</label>
                <input
                  type="number"
                  min="1"
                  value={formData.passengers || 1}
                  onChange={(e) => handleChange('passengers', e.target.value)}
                  disabled={isReservationLockedForClient}
                />
              </div>

              <div className="field">
                <label>Point de Départ :</label>
                <input
                  type="text"
                  value={formData.origin || ''}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  placeholder="Ex: Hôtel Karibe, Pétion-Ville"
                  required
                  disabled={isReservationLockedForClient}
                />
              </div>

              <div className="field">
                <label>Destination :</label>
                <input
                  type="text"
                  value={formData.destination || ''}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Ex: Côte des Arcadins"
                  required
                  disabled={isReservationLockedForClient}
                />
              </div>

              <div className="field">
                <label>Date :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                  disabled={isReservationLockedForClient}
                />
              </div>

              <div className="field">
                <label>Heure :</label>
                <input
                  type="time"
                  value={formData.time || '09:00'}
                  onChange={(e) => handleChange('time', e.target.value)}
                  required
                  disabled={isReservationLockedForClient}
                />
              </div>

              {!isClientUser && (
                <>
                  <div className="field">
                    <label>Conducteur Assigné (Optionnel) :</label>
                    <select
                      value={formData.driver || ''}
                      onChange={(e) => handleChange('driver', e.target.value)}
                    >
                      <option value="">-- Aucun conducteur assigné --</option>
                      {chauffeurs.map((c) => (
                        <option key={c.id} value={`${c.prenom} ${c.nom}`}>
                          {c.prenom} {c.nom} ({c.statut})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Véhicule Assigné (Optionnel) :</label>
                    <select
                      value={formData.vehicle || ''}
                      onChange={(e) => handleChange('vehicle', e.target.value)}
                    >
                      <option value="">-- Aucun véhicule assigné --</option>
                      {vehicules.map((v) => (
                        <option key={v.id} value={`${v.modele} (${v.plaque})`}>
                          {v.modele} - {v.plaque} ({v.statut})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Montant Estimé ($ USD) :</label>
                    <input
                      type="number"
                      value={formData.amount || 120}
                      onChange={(e) => handleChange('amount', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>Statut de la Réservation :</label>
                    <select
                      value={formData.status || 'En attente'}
                      onChange={(e) => handleChange('status', e.target.value)}
                    >
                      <option value="En attente">En attente (Demande client)</option>
                      <option value="Devis émis">Devis émis</option>
                      <option value="Facturé">Facturé (En attente de paiement)</option>
                      <option value="Confirmée">Confirmée (Validée & Payée)</option>
                      <option value="En cours">En cours (Mission active)</option>
                      <option value="Terminée">Terminée (Clôturée)</option>
                      <option value="Annulée">Annulée</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CLIENT QUOTE REQUEST FORM */}
          {(type === 'demande-devis' || (type === 'proforma' && isClientUser)) && (
            <div className="form-grid">
              <div className="field full" style={{ background: '#f0f5ff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dbeafe', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 750, color: '#082b70', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span>
                  <span>Formulaire de Demande de Devis Personnalisé</span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Renseignez vos souhaits de trajet. Notre équipe commerciale étudie votre itinéraire et vous transmet un devis officiel détaillé sous 2 heures.
                </div>
              </div>

              <div className="field">
                <label>Prestation Souhaitée :</label>
                <select
                  value={formData.service || 'Transfert Aéroport Toussaint Louverture'}
                  onChange={(e) => handleChange('service', e.target.value)}
                  required
                >
                  <option value="Transfert Aéroport Toussaint Louverture">Transfert Aéroport Toussaint Louverture</option>
                  <option value="Location SUV / Berline VIP avec Chauffeur">Location SUV / 4x4 VIP avec Chauffeur</option>
                  <option value="Circuit Touristique Côte des Arcadins">Circuit Touristique Côte des Arcadins</option>
                  <option value="Circuit Découverte Citadelle & Cap-Haïtien">Circuit Citadelle & Cap-Haïtien</option>
                  <option value="Circuit Balnéaire Jacmel & Sud">Circuit Balnéaire Jacmel & Sud</option>
                  <option value="Transport Corporate / Missions Diplomatiques">Transport Corporate / Missions Diplomatiques</option>
                  <option value="Transport de Groupe / Navette Événementielle">Transport de Groupe (Minibus / Bus)</option>
                  <option value="Autre prestation sur mesure">Autre prestation sur mesure</option>
                </select>
              </div>

              <div className="field">
                <label>Type de Véhicule Souhaité :</label>
                <select
                  value={formData.vehicleType || 'SUV 4x4 VIP (Toyota Prado)'}
                  onChange={(e) => handleChange('vehicleType', e.target.value)}
                >
                  <option value="SUV 4x4 VIP (Toyota Prado)">SUV 4x4 VIP (Toyota Prado TXL)</option>
                  <option value="Berline Confort VIP">Berline Confort VIP</option>
                  <option value="Minibus VIP Grand Cabin (10-14 pers)">Minibus VIP HiAce (10-14 pers)</option>
                  <option value="Bus Scolaire / Autocar Coaster (30 pers)">Bus Coaster (30 pers)</option>
                  <option value="Véhicule Blindé VIP">Véhicule Blindé VIP (sur demande)</option>
                </select>
              </div>

              <div className="field">
                <label>Point de Prise en Charge (Départ) :</label>
                <input
                  type="text"
                  value={formData.origin || ''}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  placeholder="Ex: Aéroport Toussaint Louverture / Pétion-Ville"
                  required
                />
              </div>

              <div className="field">
                <label>Lieu de Destination :</label>
                <input
                  type="text"
                  value={formData.destination || ''}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Ex: Hôtel Karibe, Decameron Côte des Arcadins..."
                  required
                />
              </div>

              <div className="field">
                <label>Date Souhaitée :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Heure Prévue :</label>
                <input
                  type="time"
                  value={formData.time || '09:00'}
                  onChange={(e) => handleChange('time', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Nombre de Passagers :</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.passengers || 1}
                  onChange={(e) => handleChange('passengers', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Votre Numéro WhatsApp / Téléphone :</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 XXXX XXXX"
                  required
                />
              </div>

              <div className="field full">
                <label>Votre Adresse Email pour recevoir le devis :</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="votre-email@exemple.com"
                  required
                />
              </div>

              <div className="field full">
                <label>Précisions, bagages ou demandes spécifiques :</label>
                <textarea
                  value={formData.specialRequests || ''}
                  onChange={(e) => handleChange('specialRequests', e.target.value)}
                  placeholder="Ex: 4 grosses valises, besoin d'un chauffeur anglophone, trajet aller-retour prévu..."
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* STAFF PROFORMA FORM */}
          {type === 'proforma' && !isClientUser && (
            <div className="form-grid">
              <div className="field">
                <label>Numéro de Devis :</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => handleChange('number', e.target.value)}
                  placeholder="Ex: PRO-2026-003"
                  required
                />
              </div>

              <div className="field">
                <label>Dossier / Réservation Liée (Optionnel) :</label>
                <select
                  value={formData.reservationId || ''}
                  onChange={(e) => {
                    const chosenResId = e.target.value;
                    handleChange('reservationId', chosenResId);
                    const chosenRes = reservations.find(r => r.id === chosenResId);
                    if (chosenRes) {
                      handleChange('dossierId', chosenRes.dossierId || chosenRes.id);
                      handleChange('client', chosenRes.client);
                      if (chosenRes.clientId) handleChange('clientId', chosenRes.clientId);
                      if (chosenRes.telephone) handleChange('telephone', chosenRes.telephone);
                      if (chosenRes.email) handleChange('clientEmail', chosenRes.email);
                      if (chosenRes.service) handleChange('service', chosenRes.service);
                      if (chosenRes.amount) handleChange('amount', chosenRes.amount);
                    }
                  }}
                >
                  <option value="">-- Devis direct (sans dossier lié) --</option>
                  {reservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.dossierId || r.id} • {r.client} • {r.service || 'Course'} ({r.date}) [{r.status}]
                    </option>
                  ))}
                </select>
              </div>

              {formData.dossierId && (
                <div className="field">
                  <label>Numéro de Dossier Associé :</label>
                  <input
                    type="text"
                    value={formData.dossierId}
                    readOnly
                    style={{ background: '#f8fafc', color: '#082b70', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              )}

              <div className="field">
                <label>Client Destinataire :</label>
                <input
                  type="text"
                  list="clients-list-proforma"
                  value={formData.client || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('client', val);
                    const match = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (match) {
                      if (match.id) handleChange('clientId', match.id);
                      if (match.telephone) handleChange('telephone', match.telephone);
                      if (match.email) handleChange('clientEmail', match.email);
                    }
                  }}
                  placeholder="Nom du client ou entreprise"
                  required
                />
                <datalist id="clients-list-proforma">
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.telephone ? `${c.telephone} - ${c.type || 'Client'}` : ''}</option>
                  ))}
                </datalist>
              </div>

              <div className="field full">
                <label>Objet / Description de la Prestation :</label>
                <input
                  type="text"
                  value={formData.service || ''}
                  onChange={(e) => handleChange('service', e.target.value)}
                  placeholder="Ex: Mise à disposition 4x4 Prado TXL 3 jours"
                  required
                />
              </div>

              <div className="field">
                <label>Date d'émission :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Montant Hors Taxe ($ USD) :</label>
                <input
                  type="number"
                  value={formData.amount || 0}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Statut Commercial :</label>
                <select
                  value={formData.status || 'En attente'}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="En attente">En attente</option>
                  <option value="Acceptée">Acceptée</option>
                  <option value="Refusée">Refusée</option>
                </select>
              </div>
            </div>
          )}

          {/* FACTURE FORM */}
          {type === 'facture' && !isClientUser && (
            <div className="form-grid">
              <div className="field">
                <label>Numéro de Facture :</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => handleChange('number', e.target.value)}
                  placeholder="Ex: FAC-2026-003"
                  required
                />
              </div>

              <div className="field">
                <label>Devis Proforma Lié (Optionnel) :</label>
                <select
                  value={formData.proformaNumber || ''}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    handleChange('proformaNumber', chosen);
                    const matchingPro = proformas.find(p => p.number === chosen);
                    if (matchingPro) {
                      handleChange('client', matchingPro.client);
                      if (matchingPro.clientId) handleChange('clientId', matchingPro.clientId);
                      if (matchingPro.clientEmail) handleChange('clientEmail', matchingPro.clientEmail);
                      if (matchingPro.telephone) handleChange('telephone', matchingPro.telephone);
                      if (matchingPro.reservationId) handleChange('reservationId', matchingPro.reservationId);
                      if (matchingPro.dossierId) handleChange('dossierId', matchingPro.dossierId);
                      if (matchingPro.service) handleChange('service', matchingPro.service);
                      handleChange('amount', matchingPro.totalTTC || matchingPro.amount || 0);
                    }
                  }}
                >
                  <option value="">-- Facture directe (sans devis lié) --</option>
                  {proformas.map((p) => (
                    <option key={p.id} value={p.number}>
                      {p.number} • {p.client} • ${p.totalTTC || p.amount} USD [{p.status}]
                    </option>
                  ))}
                </select>
              </div>

              {formData.dossierId && (
                <div className="field">
                  <label>Numéro de Dossier Associé :</label>
                  <input
                    type="text"
                    value={formData.dossierId}
                    readOnly
                    style={{ background: '#f8fafc', color: '#082b70', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              )}

              <div className="field">
                <label>Client Facturé :</label>
                <input
                  type="text"
                  list="clients-list-facture"
                  value={formData.client || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('client', val);
                    const match = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (match) {
                      if (match.id) handleChange('clientId', match.id);
                      if (match.telephone) handleChange('telephone', match.telephone);
                      if (match.email) handleChange('clientEmail', match.email);
                    }
                  }}
                  required
                />
                <datalist id="clients-list-facture">
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.telephone ? `${c.telephone} - ${c.type || 'Client'}` : ''}</option>
                  ))}
                </datalist>
              </div>

              <div className="field">
                <label>Montant Total ($ USD) :</label>
                <input
                  type="number"
                  value={formData.amount || 0}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Date de Facturation :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Date d'Échéance :</label>
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Mode de Règlement :</label>
                <select
                  value={formData.paymentMethod || 'Virement Bancaire'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                >
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="MonCash">MonCash</option>
                  <option value="Natcash">Natcash</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque Commercial">Chèque Commercial</option>
                  <option value="Carte de Crédit">Carte de Crédit</option>
                </select>
              </div>

              <div className="field">
                <label>Statut de Paiement :</label>
                <select
                  value={formData.status || 'En attente'}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="En attente">En attente de paiement</option>
                  <option value="Payée">Payée intégralement</option>
                  <option value="En retard">En retard</option>
                  <option value="Annulée">Annulée</option>
                </select>
              </div>
            </div>
          )}

          {/* CLIENT FORM */}
          {type === 'client' && (
            <div className="form-grid">
              <div className="field">
                <label>Nom ou Raison Sociale :</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Ambassade de Suisse"
                  required
                />
              </div>

              <div className="field">
                <label>Type de Client :</label>
                <select
                  value={formData.type || 'Particulier'}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                  <option value="Ambassade / ONG">Ambassade / ONG</option>
                  <option value="École">École / Établissement</option>
                  <option value="Touriste">Touriste / Diaspora</option>
                </select>
              </div>

              <div className="field">
                <label>Téléphone :</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 3700 0000"
                  required
                />
              </div>

              <div className="field">
                <label>Adresse E-mail :</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@domaine.com"
                />
              </div>

              <div className="field full">
                <label>Adresse Physique :</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Pétion-Ville, Port-au-Prince"
                />
              </div>
            </div>
          )}

          {/* ELEVE FORM */}
          {type === 'eleve' && (
            <div className="form-grid">
              <div className="field">
                <label>Nom de Famille :</label>
                <input
                  type="text"
                  value={formData.nom || ''}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Prénom de l'Élève :</label>
                <input
                  type="text"
                  value={formData.prenom || ''}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Établissement Scolaire :</label>
                <input
                  type="text"
                  value={formData.ecole || ''}
                  onChange={(e) => handleChange('ecole', e.target.value)}
                  placeholder="Ex: Lycée Alexandre Dumas"
                  required
                />
              </div>

              <div className="field">
                <label>Classe :</label>
                <input
                  type="text"
                  value={formData.classe || ''}
                  onChange={(e) => handleChange('classe', e.target.value)}
                  placeholder="Ex: 5ème B"
                />
              </div>

              <div className="field full">
                <label>Point d'Arrêt / Ramassage Domicile :</label>
                <input
                  type="text"
                  value={formData.arretRamassage || ''}
                  onChange={(e) => handleChange('arretRamassage', e.target.value)}
                  placeholder="Ex: Delmas 75, devant pharmacie"
                  required
                />
              </div>

              <div className="field">
                <label>Nom du Parent / Tuteur :</label>
                <input
                  type="text"
                  value={formData.parentNom || ''}
                  onChange={(e) => handleChange('parentNom', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Téléphone Parent :</label>
                <input
                  type="tel"
                  value={formData.parentTelephone || ''}
                  onChange={(e) => handleChange('parentTelephone', e.target.value)}
                  placeholder="+509 3441 9920"
                  required
                />
              </div>

              <div className="field">
                <label>Frais Mensuel ($ USD) :</label>
                <input
                  type="number"
                  value={formData.fraisMensuel || 150}
                  onChange={(e) => handleChange('fraisMensuel', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Conducteur Attitré (Optionnel) :</label>
                <select
                  value={formData.chauffeurAssigne || ''}
                  onChange={(e) => handleChange('chauffeurAssigne', e.target.value)}
                >
                  <option value="">-- Assigner un conducteur --</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={`${c.prenom} ${c.nom}`}>
                      {c.prenom} {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Autocar / Navette Assignée (Optionnel) :</label>
                <select
                  value={formData.vehiculeAssigne || ''}
                  onChange={(e) => handleChange('vehiculeAssigne', e.target.value)}
                >
                  <option value="">-- Assigner un autocar / minibus --</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={`${v.modele} (${v.plaque})`}>
                      {v.modele} - {v.plaque}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Statut :</label>
                <select
                  value={formData.statut || 'Actif'}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="Actif">Actif</option>
                  <option value="En pause">En pause</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
            </div>
          )}

          {/* ABONNEMENT FORM */}
          {type === 'abonnement' && (
            <div className="form-grid">
              <div className="field">
                <label>Client / Entreprise :</label>
                <input
                  type="text"
                  value={formData.client || ''}
                  onChange={(e) => handleChange('client', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Nom du Bénéficiaire (Optionnel) :</label>
                <input
                  type="text"
                  value={formData.eleveNom || ''}
                  onChange={(e) => handleChange('eleveNom', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Type de Contrat :</label>
                <select
                  value={formData.typeAbonnement || 'Scolaire'}
                  onChange={(e) => handleChange('typeAbonnement', e.target.value)}
                >
                  <option value="Scolaire">Scolaire</option>
                  <option value="Corporate">Corporate / Entreprise</option>
                  <option value="Navette Entreprise">Navette Entreprise</option>
                  <option value="VIP Mensuel">VIP Mensuel</option>
                </select>
              </div>

              <div className="field">
                <label>Tarif Mensuel ($ USD) :</label>
                <input
                  type="number"
                  value={formData.tarifMensuel || 150}
                  onChange={(e) => handleChange('tarifMensuel', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Date Début :</label>
                <input
                  type="date"
                  value={formData.dateDebut || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('dateDebut', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Date Fin :</label>
                <input
                  type="date"
                  value={formData.dateFin || ''}
                  onChange={(e) => handleChange('dateFin', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* VEHICULE FORM */}
          {type === 'vehicule' && (
            <div className="form-grid">
              <div className="field">
                <label>Plaque d'Immatriculation :</label>
                <input
                  type="text"
                  value={formData.plaque || ''}
                  onChange={(e) => handleChange('plaque', e.target.value)}
                  placeholder="Ex: AA-98124"
                  required
                />
              </div>

              <div className="field">
                <label>Marque & Modèle :</label>
                <input
                  type="text"
                  value={formData.modele ? `${formData.marque || 'Toyota'} ${formData.modele}` : (formData.modele || '')}
                  onChange={(e) => {
                    handleChange('marque', 'Toyota');
                    handleChange('modele', e.target.value);
                  }}
                  placeholder="Ex: Land Cruiser Prado TXL"
                  required
                />
              </div>

              <div className="field">
                <label>Catégorie :</label>
                <select
                  value={formData.categorie || 'SUV VIP'}
                  onChange={(e) => handleChange('categorie', e.target.value)}
                >
                  <option value="SUV VIP">SUV VIP</option>
                  <option value="Minibus HiAce">Minibus HiAce</option>
                  <option value="Autocar / Coaster">Autocar / Coaster</option>
                  <option value="Berline VIP">Berline VIP</option>
                  <option value="4x4 Tout-Terrain">4x4 Tout-Terrain</option>
                </select>
              </div>

              <div className="field">
                <label>Capacité Passagers :</label>
                <input
                  type="number"
                  value={formData.capacitePassagers || 5}
                  onChange={(e) => handleChange('capacitePassagers', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Kilométrage Actuel :</label>
                <input
                  type="number"
                  value={formData.kilometrage || 0}
                  onChange={(e) => handleChange('kilometrage', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Statut Flotte :</label>
                <select
                  value={formData.statut || 'Disponible'}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En mission">En mission</option>
                  <option value="En maintenance">En maintenance</option>
                  <option value="Réservé">Réservé</option>
                  <option value="Hors service">Hors service</option>
                </select>
              </div>
            </div>
          )}

          {/* CHAUFFEUR FORM */}
          {type === 'chauffeur' && (
            <div className="form-grid">
              <div className="field">
                <label>Nom :</label>
                <input
                  type="text"
                  value={formData.nom || ''}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Prénom :</label>
                <input
                  type="text"
                  value={formData.prenom || ''}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Téléphone :</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 3788 1245"
                  required
                />
              </div>

              <div className="field">
                <label>Numéro de Permis de Conduire :</label>
                <input
                  type="text"
                  value={formData.permisNumero || ''}
                  onChange={(e) => handleChange('permisNumero', e.target.value)}
                  placeholder="HT-P-449102"
                  required
                />
              </div>

              <div className="field">
                <label>Véhicule Assigné :</label>
                <input
                  type="text"
                  value={formData.vehiculeActuel || ''}
                  onChange={(e) => handleChange('vehiculeActuel', e.target.value)}
                  placeholder="Ex: Toyota Land Cruiser Prado TXL"
                />
              </div>

              <div className="field">
                <label>Statut de Service :</label>
                <select
                  value={formData.statut || 'En service'}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="En service">En service</option>
                  <option value="En course">En course</option>
                  <option value="En pause">En pause</option>
                  <option value="Congé">Congé</option>
                  <option value="Indisponible">Indisponible</option>
                </select>
              </div>
            </div>
          )}

          {/* PLANNING FORM */}
          {type === 'planning' && (
            <div className="form-grid">
              <div className="field">
                <label>Date du Trajet :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Heure de Départ :</label>
                <input
                  type="time"
                  value={formData.heure || '08:00'}
                  onChange={(e) => handleChange('heure', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Client ou Titre Mission :</label>
                <input
                  type="text"
                  list="clients-list-planning"
                  value={formData.client || ''}
                  onChange={(e) => handleChange('client', e.target.value)}
                  placeholder="Sélectionnez ou tapez le nom du client"
                  required
                />
                <datalist id="clients-list-planning">
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.type || 'Client'}</option>
                  ))}
                </datalist>
              </div>

              <div className="field">
                <label>Service :</label>
                <input
                  type="text"
                  value={formData.service || 'Transfert VIP'}
                  onChange={(e) => handleChange('service', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Point de Départ :</label>
                <input
                  type="text"
                  value={formData.depart || ''}
                  onChange={(e) => handleChange('depart', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Destination :</label>
                <input
                  type="text"
                  value={formData.destination || ''}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Conducteur Assigné :</label>
                <select
                  value={formData.chauffeur || ''}
                  onChange={(e) => handleChange('chauffeur', e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un conducteur --</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={`${c.prenom} ${c.nom}`}>
                      {c.prenom} {c.nom} ({c.statut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Véhicule Assigné :</label>
                <select
                  value={formData.vehicule || ''}
                  onChange={(e) => handleChange('vehicule', e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={`${v.modele} (${v.plaque})`}>
                      {v.modele} [{v.plaque}] - {v.categorie} ({v.statut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Statut de Mission :</label>
                <select
                  value={formData.statut || 'Programmé'}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="Programmé">Programmé</option>
                  <option value="En cours">En cours (Mission active)</option>
                  <option value="Achevé">Achevé (Mission terminée)</option>
                  <option value="Retardé">Retardé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>
          )}

          {/* PAIEMENT FORM */}
          {type === 'paiement' && (
            <div className="form-grid">
              <div className="field">
                <label>Numéro de Référence :</label>
                <input
                  type="text"
                  value={formData.reference || ''}
                  onChange={(e) => handleChange('reference', e.target.value)}
                  placeholder="MONCASH-..."
                  required
                />
              </div>

              <div className="field">
                <label>Client :</label>
                <input
                  type="text"
                  list="clients-list-paiement"
                  value={formData.client || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('client', val);
                    const match = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (match) {
                      if (match.id) handleChange('clientId', match.id);
                      if (match.email) handleChange('clientEmail', match.email);
                    }
                  }}
                  required
                />
                <datalist id="clients-list-paiement">
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.telephone ? `${c.telephone} - ${c.type || 'Client'}` : ''}</option>
                  ))}
                </datalist>
              </div>

              <div className="field">
                <label>Montant Encaissé :</label>
                <input
                  type="number"
                  value={formData.montant || 0}
                  onChange={(e) => handleChange('montant', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Devise :</label>
                <select
                  value={formData.devise || 'USD'}
                  onChange={(e) => handleChange('devise', e.target.value)}
                >
                  <option value="USD">Dollar Américain ($ USD)</option>
                  <option value="HTG">Gourde Haïtienne (HTG)</option>
                </select>
              </div>

              <div className="field">
                <label>Mode de Règlement :</label>
                <select
                  value={formData.modePaiement || 'MonCash'}
                  onChange={(e) => handleChange('modePaiement', e.target.value)}
                >
                  <option value="MonCash">MonCash</option>
                  <option value="Natcash">Natcash</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Carte de Crédit">Carte de Crédit</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>

              <div className="field">
                <label>Facture Associée (Mise à jour automatique du solde) :</label>
                <select
                  value={formData.factureAssociee || ''}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    handleChange('factureAssociee', chosen);
                    const matchingFacture = factures.find(f => f.number === chosen || f.id === chosen);
                    if (matchingFacture) {
                      handleChange('client', matchingFacture.client);
                      if (matchingFacture.clientId) handleChange('clientId', matchingFacture.clientId);
                      if (matchingFacture.clientEmail) handleChange('clientEmail', matchingFacture.clientEmail);
                      if (matchingFacture.reservationId) handleChange('reservationId', matchingFacture.reservationId);
                      if (matchingFacture.dossierId) handleChange('dossierId', matchingFacture.dossierId);
                      const rest = Math.max(0, matchingFacture.amount - (matchingFacture.paidAmount || 0));
                      handleChange('montant', rest > 0 ? rest : matchingFacture.amount);
                      handleChange('devise', matchingFacture.currency || 'USD');
                      handleChange('motif', `Règlement facture ${matchingFacture.number} (${matchingFacture.client})`);
                    }
                  }}
                >
                  <option value="">-- Paiement libre (sans facture liée) --</option>
                  {factures.map((f) => {
                    const solde = f.amount - (f.paidAmount || 0);
                    return (
                      <option key={f.id} value={f.number}>
                        {f.number} • {f.client} • Dû: ${solde.toLocaleString()} {f.currency || 'USD'} [{f.status}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {formData.dossierId && (
                <div className="field">
                  <label>Numéro de Dossier Associé :</label>
                  <input
                    type="text"
                    value={formData.dossierId}
                    readOnly
                    style={{ background: '#f8fafc', color: '#082b70', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              )}

              <div className="field full">
                <label>Motif de Paiement :</label>
                <input
                  type="text"
                  value={formData.motif || ''}
                  onChange={(e) => handleChange('motif', e.target.value)}
                  placeholder="Règlement course / abonnement"
                  required
                />
              </div>
            </div>
          )}

          {/* UTILISATEUR FORM */}
          {type === 'utilisateur' && (
            <div className="form-grid">
              <div className="field">
                <label>Nom Complet :</label>
                <input
                  type="text"
                  value={formData.nom || formData.name || ''}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  placeholder="Ex: Jean-Marc Delacroix"
                  required
                />
              </div>

              <div className="field">
                <label>Adresse E-mail :</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="collaborateur@laperletour.ht"
                  required
                />
              </div>

              <div className="field">
                <label>Numéro de Téléphone :</label>
                <input
                  type="tel"
                  value={formData.telephone || formData.phone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 3723 3816"
                />
              </div>

              <div className="field">
                <label>Rôle Attribué (Géré par l'Administrateur) :</label>
                <select
                  value={formData.role || 'client'}
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  <option value="admin">Administrateur (Accès Total)</option>
                  <option value="direction">Direction Générale</option>
                  <option value="comptabilite">Comptabilité & Finances</option>
                  <option value="secretaire">Secrétariat & Accueil</option>
                  <option value="operations">Opérations & Régulation</option>
                  <option value="chauffeur">Chauffeur VIP</option>
                  <option value="client">Client VIP Portefeuille</option>
                  <option value="prospect">Prospect</option>
                  <option value="lecture_seule">Consultation / Lecture Seule</option>
                </select>
              </div>

              <div className="field">
                <label>Statut du Compte :</label>
                <select
                  value={formData.status || 'actif'}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="actif">Actif (Autorisé)</option>
                  <option value="inactif">Désactivé (Bloqué)</option>
                </select>
              </div>
            </div>
          )}

          {isReservationLockedForClient ? (
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button type="button" className="secondary" onClick={onClose}>
                Fermer
              </button>
              <button
                type="button"
                className="primary"
                style={{ background: '#082b70', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  onClose();
                  setChatModalOpen(true);
                }}
              >
                💬 Contacter la Secrétaire
              </button>
            </div>
          ) : (
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="primary">
                Enregistrer
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
