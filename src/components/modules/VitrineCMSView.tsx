import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const VitrineCMSView: React.FC = () => {
  const { settings, saveSettings, setIsPublicLanding, showToast } = useApp();
  const [slogan, setSlogan] = useState(settings.slogan || 'Un coup d\'œil sur Haïti');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '+509 4440 8687');
  const [email, setEmail] = useState(settings.email || 'laperletourht@gmail.com');
  const [tauxChange, setTauxChange] = useState(settings.tauxChangeUSD_HTG || 132);
  const [bannierePromoActive, setBannierePromoActive] = useState(settings.bannierePromoActive ?? true);
  const [bannierePromoTexte, setBannierePromoTexte] = useState(
    settings.bannierePromoTexte || '✨ Service Premium Laperle : Demandez votre Devis Proforma officiel en 1 clic sur WhatsApp et sur le site !'
  );
  const [tarifBaseTourisme, setTarifBaseTourisme] = useState(settings.tarifBaseTourisme || 120);
  const [tarifBaseVip, setTarifBaseVip] = useState(settings.tarifBaseVip || 250);
  const [tarifBaseScolaire, setTarifBaseScolaire] = useState(settings.tarifBaseScolaire || 150);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings({
      slogan,
      whatsapp,
      email,
      tauxChangeUSD_HTG: Number(tauxChange),
      bannierePromoActive,
      bannierePromoTexte,
      tarifBaseTourisme: Number(tarifBaseTourisme),
      tarifBaseVip: Number(tarifBaseVip),
      tarifBaseScolaire: Number(tarifBaseScolaire)
    });
    showToast('Contenu de la vitrine et paramètres mis à jour avec succès !', 'success');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Gestion de la Vitrine Publique & CMS</h2>
          <p>Personnalisez le bandeau promotionnel, les tarifs de référence, les coordonnées et les textes visibles sur le site public.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setIsPublicLanding(true)}>
            🌐 Prévisualiser le Site Public
          </button>
        </div>
      </div>

      <div className="data-panel" style={{ maxWidth: '880px' }}>
        <form onSubmit={handleSaveCMS}>
          {/* Section 1 : Bandeau Promotionnel (Option D) */}
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#082b70', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📢</span> Bandeau Promotionnel en Tête de Site
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px', fontSize: '13.5px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={bannierePromoActive}
                onChange={(e) => setBannierePromoActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ea580c' }}
              />
              Activer le bandeau promotionnel sur la page d'accueil
            </label>

            <div className="field full">
              <label>Texte de l'annonce ou promotion :</label>
              <input
                type="text"
                value={bannierePromoTexte}
                onChange={(e) => setBannierePromoTexte(e.target.value)}
                placeholder="Ex: ✨ Offre Spéciale : -15% sur tous les trajets Aller-Retour..."
                disabled={!bannierePromoActive}
                style={{ opacity: bannierePromoActive ? 1 : 0.6 }}
              />
            </div>
          </div>

          {/* Section 2 : Tarifs de Base du Simulateur (Option D) */}
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#082b70', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏷️</span> Tarifs de Base des Services (en USD)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px' }}>
              Ces montants servent de point de départ pour le calcul interactif du simulateur et les cartes de la page vitrine.
            </p>
            <div className="form-grid">
              <div className="field">
                <label>Circuit Tourisme ($ USD) :</label>
                <input
                  type="number"
                  min="1"
                  value={tarifBaseTourisme}
                  onChange={(e) => setTarifBaseTourisme(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Location SUV VIP / jour ($ USD) :</label>
                <input
                  type="number"
                  min="1"
                  value={tarifBaseVip}
                  onChange={(e) => setTarifBaseVip(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Transport Scolaire / mois ($ USD) :</label>
                <input
                  type="number"
                  min="1"
                  value={tarifBaseScolaire}
                  onChange={(e) => setTarifBaseScolaire(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Taux de Change Simulateur (1 USD en HTG) :</label>
                <input
                  type="number"
                  step="0.1"
                  value={tauxChange}
                  onChange={(e) => setTauxChange(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 3 : Identité & Contact */}
          <div className="form-grid">
            <div className="field full">
              <label>Slogan Officiel :</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="« Un coup d'œil sur Haïti »"
              />
            </div>

            <div className="field">
              <label>Numéro WhatsApp de Réservation :</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+509 4440 8687"
              />
            </div>

            <div className="field">
              <label>E-mail Public de Contact :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="laperletourht@gmail.com"
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="submit" className="primary">
              💾 Enregistrer les Modifications CMS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
