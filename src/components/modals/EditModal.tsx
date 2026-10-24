import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface EditModalProps {
  type: string | null;
  data: any;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ type, data, onClose }) => {
  const { user, profile, role } = useAuth();
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
    factures
  } = useApp();

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

      if (type === 'demande-devis' || (type === 'proforma' && isClientUser)) {
        const clientName = formData.client || profile?.nom || profile?.name || user?.displayName || 'Client';
        const clientEmail = formData.email || formData.clientEmail || user?.email || profile?.email || '';
        const clientPhone = formData.telephone || profile?.telephone || profile?.phone || '';
        const service = formData.service || 'Transfert VIP / Course Privée';
        const devisNumber = `DEV-${Date.now().toString().slice(-6)}`;
        
        await saveProforma({
          ...formData,
          number: devisNumber,
          client: clientName,
          clientId: user?.uid || profile?.id || '',
          clientEmail,
          telephone: clientPhone,
          service,
          date: formData.date || new Date().toISOString().slice(0, 10),
          amount: 0,
          tva: 0,
          totalTTC: 0,
          status: 'En attente',
          notes: `Demande de devis client:\n- Prestation : ${service}\n- Trajet : ${formData.origin || 'Port-au-Prince'} ➔ ${formData.destination || 'À définir'}\n- Date & Heure souhaitées : ${formData.date || ''} à ${formData.time || '09:00'}\n- Passagers : ${formData.passengers || 1}\n- Véhicule souhaité : ${formData.vehicleType || 'SUV / Berline VIP'}\n- Remarques particulières : ${formData.specialRequests || 'Aucune'}`
        });

        await addNotification({
          title: `Nouvelle demande de devis : ${service}`,
          message: `${clientName} (${clientEmail} / ${clientPhone}) demande un chiffrage pour ${formData.origin || 'Port-au-Prince'} ➔ ${formData.destination || 'Destination'}.`,
          type: 'info',
          link: 'proformas'
        });

        showToast('Votre demande de devis a bien été transmise à notre équipe commerciale !', 'success');
        onClose();
        return;
      }

      switch (type) {
        case 'reservation':
          await saveReservation({
            ...formData,
            client: isClientUser ? (profile?.nom || profile?.name || user?.displayName || formData.client) : formData.client,
            clientId: isClientUser ? (user?.uid || profile?.id) : formData.clientId,
            telephone: isClientUser ? (profile?.telephone || profile?.phone || formData.telephone) : formData.telephone,
            email: isClientUser ? (user?.email || profile?.email) : formData.email,
            status: isClientUser ? 'En attente' : (formData.status || 'En attente'),
            passengers: Number(formData.passengers) || 1,
            amount: Number(formData.amount) || 0
          });
          break;
        case 'proforma':
          const amount = Number(formData.amount) || 0;
          const tva = Math.round(amount * (settings.tvaPourcentage / 100));
          await saveProforma({
            ...formData,
            number: formData.number || `PRO-${Date.now().toString().slice(-6)}`,
            amount,
            tva,
            totalTTC: amount + tva,
            status: formData.status || 'En attente'
          });
          break;
        case 'facture':
          await saveFacture({
            ...formData,
            number: formData.number || `FAC-${Date.now().toString().slice(-6)}`,
            amount: Number(formData.amount) || 0,
            status: formData.status || 'En attente'
          });
          break;
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
            statut: formData.statut || 'Validé'
          });
          break;
        case 'utilisateur':
          showToast(`Droits de ${formData.nom || formData.email} mis à jour`, 'success');
          break;
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
              <div className="field">
                <label>Nom du Client :</label>
                <input
                  type="text"
                  list="clients-list-reservation"
                  value={formData.client || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('client', val);
                    const match = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (match && match.telephone) {
                      handleChange('telephone', match.telephone);
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
              </div>

              <div className="field">
                <label>Téléphone Client :</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+509 4440 8687"
                />
              </div>

              <div className="field">
                <label>Prestation Souhaitée :</label>
                <select
                  value={formData.service || 'Circuit Touristique & Découverte'}
                  onChange={(e) => handleChange('service', e.target.value)}
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
                <label>Nombre de Passagers :</label>
                <input
                  type="number"
                  min="1"
                  value={formData.passengers || 1}
                  onChange={(e) => handleChange('passengers', e.target.value)}
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
                />
              </div>

              <div className="field">
                <label>Date :</label>
                <input
                  type="date"
                  value={formData.date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Heure :</label>
                <input
                  type="time"
                  value={formData.time || '09:00'}
                  onChange={(e) => handleChange('time', e.target.value)}
                  required
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
                      <option value="En attente">En attente</option>
                      <option value="Confirmée">Confirmée</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
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
                <label>Client Destinataire :</label>
                <input
                  type="text"
                  value={formData.client || ''}
                  onChange={(e) => handleChange('client', e.target.value)}
                  placeholder="Nom du client ou entreprise"
                  required
                />
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
                <label>Réf. Proforma liée (Optionnel) :</label>
                <input
                  type="text"
                  value={formData.proformaNumber || ''}
                  onChange={(e) => handleChange('proformaNumber', e.target.value)}
                  placeholder="Ex: PRO-2026-001"
                />
              </div>

              <div className="field">
                <label>Client Facturé :</label>
                <input
                  type="text"
                  value={formData.client || ''}
                  onChange={(e) => handleChange('client', e.target.value)}
                  required
                />
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
                  value={formData.client || ''}
                  onChange={(e) => handleChange('client', e.target.value)}
                  required
                />
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

          <div className="form-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
