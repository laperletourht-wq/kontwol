import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const ParametresView: React.FC = () => {
  const { settings, saveSettings, showToast } = useApp();
  const { user, profile } = useAuth();

  const [nom, setNom] = useState(settings.nom || 'LAPERLE TOUR HT');
  const [slogan, setSlogan] = useState(settings.slogan || 'Un coup d\'œil sur Haïti');
  const [telephone1, setTelephone1] = useState(settings.telephone1 || '+509 4440 8687');
  const [telephone2, setTelephone2] = useState(settings.telephone2 || '+509 3700 0000');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '+509 4440 8687');
  const [email, setEmail] = useState(settings.email || 'laperletourht@gmail.com');
  const [adresse, setAdresse] = useState(settings.adresse || 'Delmas 75, Port-au-Prince, Haïti');
  const [tauxChange, setTauxChange] = useState(settings.tauxChangeUSD_HTG || 132);
  const [tva, setTva] = useState(settings.tvaPourcentage || 10);
  const [numeroFiscal, setNumeroFiscal] = useState(settings.numeroFiscal || '001-234-567-8');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings({
      nom,
      slogan,
      telephone1,
      telephone2,
      whatsapp,
      email,
      adresse,
      tauxChangeUSD_HTG: Number(tauxChange),
      tvaPourcentage: Number(tva),
      numeroFiscal
    });
    showToast('Paramètres de l\'entreprise mis à jour avec succès', 'success');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Paramètres Généraux de la Société & Facturation</h2>
          <p>Configurez les informations d'en-tête de vos proformas, factures officielles et taux de change.</p>
        </div>
      </div>

      <div className="data-panel" style={{ maxWidth: '900px' }}>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="field">
              <label>Raison Sociale / Nom Entreprise :</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Slogan Officiel :</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Téléphone Ligne 1 :</label>
              <input
                type="text"
                value={telephone1}
                onChange={(e) => setTelephone1(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Téléphone Ligne 2 :</label>
              <input
                type="text"
                value={telephone2}
                onChange={(e) => setTelephone2(e.target.value)}
              />
            </div>

            <div className="field">
              <label>WhatsApp Centrale Réservation :</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="field">
              <label>E-mail Officiel :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Adresse du Siège Social :</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Numéro d'Immatriculation Fiscale (NIF / DGI) :</label>
              <input
                type="text"
                value={numeroFiscal}
                onChange={(e) => setNumeroFiscal(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Taux de Change Réglementaire (1 USD = ? HTG) :</label>
              <input
                type="number"
                step="0.1"
                value={tauxChange}
                onChange={(e) => setTauxChange(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label>Taux de Taxe / TVA (%) :</label>
              <input
                type="number"
                step="0.5"
                value={tva}
                onChange={(e) => setTva(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="submit" className="primary">
              Enregistrer les Paramètres
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
