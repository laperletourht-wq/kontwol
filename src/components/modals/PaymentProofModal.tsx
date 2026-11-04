import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Facture, Paiement } from '../../types';

interface PaymentProofModalProps {
  facture?: Facture | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  facture,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const { 
    savePaiement, 
    saveFacture, 
    addNotification, 
    showToast, 
    settings 
  } = useApp();

  const [modePaiement, setModePaiement] = useState<'MonCash' | 'Virement Bancaire' | 'Chèque' | 'Espèces'>('MonCash');
  const [referenceTransaction, setReferenceTransaction] = useState('');
  const [montant, setMontant] = useState(facture?.amount || facture?.totalTTC || 250);
  const [devise, setDevise] = useState<'USD' | 'HTG'>(facture?.currency === 'HTG' ? 'HTG' : 'USD');
  const [preuveImage, setPreuveImage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rate = settings.tauxChangeUSD_HTG || 132;

  // Handle image upload and convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('L\'image dépasse 5 Mo. Veuillez choisir une image plus légère.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreuveImage(reader.result);
        showToast('Image du reçu chargée avec succès', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceTransaction.trim()) {
      showToast('Veuillez saisir le numéro ou code de transaction.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientName = profile?.nom 
        ? `${profile.prenom || ''} ${profile.nom}`.trim() 
        : user?.displayName || facture?.client || 'Client Laperle';

      const paiementId = `PAI-${Date.now().toString().slice(-6)}`;
      const cleanRef = referenceTransaction.trim().toUpperCase();
      const newPaiement: Paiement = {
        id: paiementId,
        reference: cleanRef,
        date: new Date().toISOString().slice(0, 10),
        client: clientName,
        clientId: user?.uid || profile?.id || facture?.clientId,
        clientEmail: user?.email || profile?.email || facture?.clientEmail,
        montant: Number(montant),
        amount: Number(montant),
        devise,
        modePaiement,
        motif: facture ? `Règlement Facture ${facture.number}` : `Règlement par ${modePaiement}`,
        factureAssociee: facture?.number,
        reservationId: facture?.reservationId,
        dossierId: facture?.dossierId,
        statut: 'En attente',
        preuveImage: preuveImage || undefined,
        referenceTransaction: cleanRef,
        recuPar: 'Soumission Client en ligne'
      };

      await savePaiement(newPaiement);

      // If tied to a facture, attach proof metadata to facture
      if (facture) {
        await saveFacture({
          id: facture.id,
          number: facture.number,
          client: facture.client,
          clientId: facture.clientId,
          amount: facture.amount,
          modePaiement,
          paymentMethod: modePaiement,
          referenceTransaction: cleanRef,
          paymentReference: cleanRef,
          preuveImage: preuveImage || facture.preuveImage,
          paymentProof: preuveImage || facture.preuveImage
        });
      }

      // Send notification targeting ADMIN ONLY (not self!)
      addNotification({
        title: `Preuve de paiement reçue (${modePaiement})`,
        message: `${clientName} a soumis une preuve de règlement (${Number(montant)} ${devise}) - Réf: ${referenceTransaction}.`,
        type: 'info',
        link: 'paiements',
        targetId: paiementId,
        targetAudience: 'admin',
        authorUid: user?.uid
      });

      showToast('Preuve de paiement transmise avec succès ! Elle sera validée sous peu par la comptabilité.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting payment proof', err);
      showToast('Une erreur est survenue lors de l\'enregistrement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertedValue = devise === 'USD' 
    ? Math.round(Number(montant) * rate) 
    : (Number(montant) / rate).toFixed(2);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#082b70] to-blue-900 text-white">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💳</span>
            <div>
              <h3 className="font-bold text-base leading-tight">Soumettre une Preuve de Paiement</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                {facture ? `Pour la facture ${facture.number}` : 'Validation rapide de votre règlement'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Moyen de Règlement *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'MonCash', label: 'MonCash', icon: '📱' },
                { id: 'Virement Bancaire', label: 'Virement Bancaire', icon: '🏦' },
                { id: 'Chèque', label: 'Chèque', icon: '📝' },
                { id: 'Espèces', label: 'Cash (Bureau)', icon: '💵' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModePaiement(m.id as any)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    modePaiement === m.id
                      ? 'border-[#082b70] bg-blue-50/70 text-[#082b70] ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Reference Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Référence / N° de Transaction *
            </label>
            <input
              type="text"
              required
              value={referenceTransaction}
              onChange={(e) => setReferenceTransaction(e.target.value)}
              placeholder={
                modePaiement === 'MonCash' 
                  ? 'Ex: ID MonCash #991204' 
                  : modePaiement === 'Virement Bancaire'
                  ? 'Ex: N° Bordereau SOGEBANK / UNIBANK'
                  : 'Ex: N° de chèque ou reçu'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#082b70]/20 focus:border-[#082b70]"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Montant Réglé *
              </label>
              <input
                type="number"
                step="any"
                required
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#082b70]/20 focus:border-[#082b70]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Devise
              </label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#082b70]/20 focus:border-[#082b70]"
              >
                <option value="USD">USD ($)</option>
                <option value="HTG">HTG (Gourdes)</option>
              </select>
            </div>
          </div>

          {/* Currency equivalence preview */}
          <div className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/80 flex items-center justify-between">
            <span>Équivalence au taux de {rate} HTG :</span>
            <strong className="font-mono">
              {devise === 'USD' ? `${convertedValue.toLocaleString()} HTG` : `$${convertedValue} USD`}
            </strong>
          </div>

          {/* Receipt Image File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Photo du Reçu / Bordereau / Capture d'écran (Optionnel mais recommandé)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {preuveImage ? (
              <div className="relative rounded-xl border border-slate-300 p-2 bg-slate-50 flex items-center gap-3">
                <img
                  src={preuveImage}
                  alt="Preuve"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    Justificatif photo joint ✓
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    Prêt pour vérification
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreuveImage('')}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-[#082b70] rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors"
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs font-semibold text-slate-700">
                  Cliquez pour charger la photo du bordereau
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  JPG, PNG ou capture d'écran mobile MonCash
                </div>
              </button>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Remarque éventuelle
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Virement effectué par Mme Pierre depuis Port-au-Prince"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#082b70]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#082b70] hover:bg-blue-900 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Valider & Transmettre la Preuve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
