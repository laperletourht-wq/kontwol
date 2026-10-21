import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const VitrineCMSView: React.FC = () => {
  const { settings, saveSettings, setIsPublicLanding, showToast } = useApp();
  const [slogan, setSlogan] = useState(settings.slogan || 'Un coup d\'œil sur Haïti');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '+509 4440 8687');
  const [email, setEmail] = useState(settings.email || 'laperletourht@gmail.com');
  const [tauxChange, setTauxChange] = useState(settings.tauxChangeUSD_HTG || 132);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings({
      slogan,
      whatsapp,
      email,
      tauxChangeUSD_HTG: Number(tauxChange)
    });
    showToast('Contenu de la vitrine mis à jour avec succès !', 'success');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Gestion de la Vitrine Publique & CMS</h2>
          <p>Personnalisez les coordonnées, accroches et paramètres visibles sur le site public LAPERLE TOUR HT.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setIsPublicLanding(true)}>
            🌐 Prévisualiser le Site Public
          </button>
        </div>
      </div>

      <div className="data-panel" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSaveCMS}>
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

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="submit" className="primary">
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
