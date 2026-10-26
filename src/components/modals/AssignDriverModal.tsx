import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Reservation } from '../../types';

interface AssignDriverModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  reservation,
  onClose,
  onSuccess
}) => {
  const { chauffeurs, vehicules, assignDriverAndDispatch, showToast } = useApp();

  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string>(
    reservation.driverId || (chauffeurs.length > 0 ? chauffeurs[0].id : '')
  );
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>(
    reservation.vehicleId || (vehicules.length > 0 ? vehicules[0].id : '')
  );
  const [consignes, setConsignes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);

  const selectedChauffeur = chauffeurs.find((c) => c.id === selectedChauffeurId) || chauffeurs[0];
  const selectedVehicule = vehicules.find((v) => v.id === selectedVehiculeId) || vehicules[0];

  const handleAssign = async (openWhatsAppImmediately: boolean = false) => {
    if (!selectedChauffeur || !selectedVehicule) {
      showToast('Veuillez sélectionner un chauffeur et un véhicule.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const chauffeurNom = `${selectedChauffeur.prenom} ${selectedChauffeur.nom}`;
      const vehiculeNom = `${selectedVehicule.marque} ${selectedVehicule.modele} (${selectedVehicule.plaque})`;

      const waUrl = await assignDriverAndDispatch(
        reservation.id,
        selectedChauffeur.id,
        chauffeurNom,
        selectedVehicule.id,
        vehiculeNom,
        selectedChauffeur.telephone,
        consignes
      );

      setLastWhatsAppUrl(waUrl);

      if (openWhatsAppImmediately) {
        window.open(waUrl, '_blank');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'assignation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#082b70] to-[#123c98] text-white p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-orange-300 tracking-wider uppercase flex items-center gap-1.5">
              <span>🚗</span>
              <span>RÉGULATION & DISPATCH FLOTTE</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Assigner un Chauffeur & Véhicule
            </h3>
            <p className="text-xs text-sky-100 mt-0.5">
              Course {reservation.id} · {reservation.client} ({reservation.service || 'Course VIP'})
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Mission Details Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">📍 Trajet :</span>
              <span className="font-bold text-[#082b70]">
                {reservation.origin || 'Port-au-Prince'} ➔ {reservation.destination || 'Destination'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">📅 Date & Heure :</span>
              <span>{reservation.date} à {reservation.time || '08:00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">👤 Contact Client :</span>
              <span>{reservation.client} {reservation.telephone ? `(${reservation.telephone})` : ''}</span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3.5">
            {/* Chauffeur Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Chauffeur Assermenté <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedChauffeurId}
                onChange={(e) => setSelectedChauffeurId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#082b70]"
              >
                {chauffeurs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom} · Permis {c.permisNumero || 'Valide'} ({c.telephone || 'WhatsApp'})
                  </option>
                ))}
              </select>
            </div>

            {/* Véhicule Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Véhicule VIP <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVehiculeId}
                onChange={(e) => setSelectedVehiculeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#082b70]"
              >
                {vehicules.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marque} {v.modele} · Plaque {v.plaque} ({v.statut})
                  </option>
                ))}
              </select>
            </div>

            {/* Consignes particulières */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Consignes Spécifiques pour le Chauffeur (Optionnel)
              </label>
              <textarea
                value={consignes}
                onChange={(e) => setConsignes(e.target.value)}
                rows={2}
                placeholder="Ex: Pancarte d'accueil personnalisée à la sortie des bagages, tenue VIP..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#082b70]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAssign(false)}
            className="px-4 py-2 bg-[#082b70] hover:bg-[#0c378d] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🚗</span>
            <span>{isSubmitting ? 'Assignation...' : 'Valider l\'Assignation'}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAssign(true)}
            className="px-4 py-2 bg-[#25d366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Valider & Envoyer WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
