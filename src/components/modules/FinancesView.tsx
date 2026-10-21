import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const FinancesView: React.FC = () => {
  const { paiements, factures, settings, showToast } = useApp();
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Compute total validated revenues
  const totalUSD = paiements
    .filter((p) => p.devise === 'USD' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalHTG = paiements
    .filter((p) => p.devise === 'HTG' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  // Invoiced amounts pending collection
  const pendingInvoicedUSD = factures
    .filter((f) => f.status !== 'Payée')
    .reduce((sum, f) => sum + f.amount, 0);

  // Estimated operational expenses (fuel, maintenance, salaries ~35%)
  const estimatedExpensesUSD = Math.round(totalUSD * 0.35);
  const netProfitUSD = totalUSD - estimatedExpensesUSD;

  const handleExportCSV = () => {
    let csv = 'Reference,Date,Client,Montant,Devise,Mode,Statut\n';
    paiements.forEach((p) => {
      csv += `"${p.reference}","${p.date}","${p.client}",${p.montant},"${p.devise}","${p.modePaiement}","${p.statut}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_Financier_Laperle_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV généré avec succès !', 'success');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Finances & Comptabilité Analytique</h2>
          <p>Bilan consolidé des recettes, encaissements, factures à recouvrer et résultat net.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={handleExportCSV}>
            📥 Exporter Rapport CSV
          </button>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-icon" style={{ background: '#1675ea' }}>💵</div>
          <div>
            <small>Recettes Encaissées ($ USD)</small>
            <strong>${totalUSD.toLocaleString()} USD</strong>
            <a>Paiements validés</a>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-icon" style={{ background: '#25a852' }}>🇭🇹</div>
          <div>
            <small>Recettes Encaissées (HTG)</small>
            <strong>{totalHTG.toLocaleString()} HTG</strong>
            <a>MonCash & Natcash</a>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-icon" style={{ background: '#f7941d' }}>⏳</div>
          <div>
            <small>Créances à Recouvrer</small>
            <strong>${pendingInvoicedUSD.toLocaleString()} USD</strong>
            <a>Factures en attente</a>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-icon" style={{ background: '#073b8f' }}>📈</div>
          <div>
            <small>Résultat d'Exploitation Estimé</small>
            <strong>${netProfitUSD.toLocaleString()} USD</strong>
            <a>Bénéfice opérationnel net</a>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="data-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: '#082b70' }}>Synthèse des Flux Financiers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Taux de change appliqué :</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#082b70', margin: '6px 0' }}>
              1 USD = {settings.tauxChangeUSD_HTG} HTG
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Calculs automatiques pour les règlements en Gourdes haïtiennes.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Dépenses opérationnelles estimées :</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c', margin: '6px 0' }}>
              ${estimatedExpensesUSD.toLocaleString()} USD
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Carburant, entretien périodique des véhicules et indemnités chauffeurs.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Taux de Recouvrement Global :</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', margin: '6px 0' }}>
              {factures.length > 0 ? Math.round((factures.filter(f => f.status === 'Payée').length / factures.length) * 100) : 100}%
            </div>
            <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
              Factures honorées sans incident majeur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
