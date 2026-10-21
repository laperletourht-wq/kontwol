import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenModal }) => {
  const { profile } = useAuth();
  const { 
    reservations, 
    proformas, 
    factures, 
    clients, 
    vehicules, 
    chauffeurs, 
    plannings, 
    paiements, 
    setCurrentModule,
    settings 
  } = useApp();

  // Compute live KPI metrics
  const activeClients = clients.length;
  const activeVehicles = vehicules.filter((v) => v.statut === 'Disponible' || v.statut === 'En mission').length;
  const activeDrivers = chauffeurs.filter((c) => c.statut === 'En service' || c.statut === 'En course').length;
  const pendingReservations = reservations.filter((r) => r.status === 'En attente' || r.status === 'En cours').length;
  const pendingProformas = proformas.filter((p) => p.status === 'En attente').length;
  
  // Total payments collected
  const totalRevenueUSD = paiements
    .filter((p) => p.devise === 'USD' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalRevenueHTG = paiements
    .filter((p) => p.devise === 'HTG' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome">
        <div>
          <h2>Centre de Contrôle Laperle</h2>
          <p>
            Bienvenue, <strong>{profile?.nom || 'Administrateur'}</strong>. Suivi opérationnel en temps réel de votre flotte et de votre facturation.
          </p>
        </div>
        <div className="quote">
          « LAPERLE TOUR HT — Un coup d'œil sur Haïti »
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpis">
        <div className="kpi" onClick={() => setCurrentModule('clients')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">👥</div>
          <div>
            <small>Clients Référencés</small>
            <strong>{activeClients}</strong>
            <a>Voir le répertoire →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('reservations')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">📅</div>
          <div>
            <small>Réservations Actives</small>
            <strong>{pendingReservations}</strong>
            <a>Gérer les courses →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('proformas')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">📋</div>
          <div>
            <small>Proformas (Devis)</small>
            <strong>{pendingProformas} en attente</strong>
            <a>Consulter les devis →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('factures')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">💳</div>
          <div>
            <small>Factures Émises</small>
            <strong>{factures.length}</strong>
            <a>Suivi des règlements →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('vehicules')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">🚗</div>
          <div>
            <small>Flotte en Ligne</small>
            <strong>{activeVehicles} / {vehicules.length}</strong>
            <a>État des véhicules →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('chauffeurs')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">👔</div>
          <div>
            <small>Chauffeurs Mobilisés</small>
            <strong>{activeDrivers} / {chauffeurs.length}</strong>
            <a>Planning conducteurs →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('paiements')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">💵</div>
          <div>
            <small>Recettes Encaissées</small>
            <strong>${totalRevenueUSD.toLocaleString()} USD</strong>
            <a>Détail des encaissements →</a>
          </div>
        </div>

        <div className="kpi" onClick={() => setCurrentModule('finances')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">📈</div>
          <div>
            <small>Caisse HTG</small>
            <strong>{totalRevenueHTG.toLocaleString()} HTG</strong>
            <a>Bilan financier complet →</a>
          </div>
        </div>
      </div>

      {/* Middle Grid: Charts and Breakdown */}
      <div className="dashboard-grid">
        {/* Financial Flow Panel */}
        <div className="panel">
          <div className="panel-title">
            <h3>Évolution Mensuelle des Recettes & Dépenses ($ USD)</h3>
            <button type="button" onClick={() => setCurrentModule('finances')}>Rapport financier</button>
          </div>
          <div className="chart">
            <div className="bars">
              <div className="bar-group">
                <div className="bar rev" style={{ height: '45%' }} title="Jan Recettes: $4,500" />
                <div className="bar exp" style={{ height: '22%' }} title="Jan Dépenses: $2,200" />
              </div>
              <div className="bar-group">
                <div className="bar rev" style={{ height: '60%' }} title="Fév Recettes: $6,000" />
                <div className="bar exp" style={{ height: '28%' }} title="Fév Dépenses: $2,800" />
              </div>
              <div className="bar-group">
                <div className="bar rev" style={{ height: '75%' }} title="Mar Recettes: $7,500" />
                <div className="bar exp" style={{ height: '35%' }} title="Mar Dépenses: $3,500" />
              </div>
              <div className="bar-group">
                <div className="bar rev" style={{ height: '85%' }} title="Avr Recettes: $8,500" />
                <div className="bar exp" style={{ height: '38%' }} title="Avr Dépenses: $3,800" />
              </div>
              <div className="bar-group">
                <div className="bar rev" style={{ height: '92%' }} title="Mai Recettes: $9,200" />
                <div className="bar exp" style={{ height: '42%' }} title="Mai Dépenses: $4,200" />
              </div>
              <div className="bar-group">
                <div className="bar rev" style={{ height: '98%' }} title="Juin Recettes: $9,800" />
                <div className="bar exp" style={{ height: '40%' }} title="Juin Dépenses: $4,000" />
              </div>
            </div>
            <div className="months">
              <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
            </div>
          </div>
          <div className="legend">
            <i></i> <span>Recettes Encaissées</span>
            <i className="orange"></i> <span>Dépenses Carburant & Maintenance</span>
          </div>
        </div>

        {/* Services Distribution Donut */}
        <div className="panel">
          <div className="panel-title">
            <h3>Répartition des Activités Laperle</h3>
            <button type="button" onClick={() => setCurrentModule('vitrine')}>Services vitrine</button>
          </div>
          <div className="services-donut">
            <div 
              className="donut" 
              style={{
                background: 'conic-gradient(#1675ea 0deg 110deg, #2ba84a 110deg 210deg, #f7941d 210deg 290deg, #7354e8 290deg 360deg)'
              }}
            />
            <div className="service-list">
              <div><span className="dot" style={{ background: '#1675ea' }}></span> <strong>35%</strong> Location SUV VIP avec chauffeur</div>
              <div><span className="dot" style={{ background: '#2ba84a' }}></span> <strong>28%</strong> Abonnements Scolaires & Navettes</div>
              <div><span className="dot" style={{ background: '#f7941d' }}></span> <strong>22%</strong> Circuits Touristiques d'Exception</div>
              <div><span className="dot" style={{ background: '#7354e8' }}></span> <strong>15%</strong> Transferts Aéroport & Corporate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Actions, Upcoming Agenda & Fleet status */}
      <div className="bottom-grid">
        {/* Quick Actions Card */}
        <div className="panel quick-card">
          <div className="panel-title">
            <h3>Actions Rapides</h3>
          </div>
          <div className="quick-list">
            <button type="button" onClick={() => onOpenModal('reservation')}>
              <span>📅 Planifier une réservation</span>
              <b>+</b>
            </button>
            <button type="button" onClick={() => onOpenModal('proforma')}>
              <span>📋 Émettre un devis proforma</span>
              <b>+</b>
            </button>
            <button type="button" onClick={() => onOpenModal('facture')}>
              <span>💳 Émettre une facture officielle</span>
              <b>+</b>
            </button>
            <button type="button" onClick={() => onOpenModal('planning')}>
              <span>⏱️ Assigner un trajet de dispatch</span>
              <b>+</b>
            </button>
            <button type="button" onClick={() => onOpenModal('paiement')}>
              <span>💵 Encaisser un paiement caisse</span>
              <b>+</b>
            </button>
          </div>
        </div>

        {/* Plannings / Upcoming Agenda Card */}
        <div className="panel">
          <div className="panel-title">
            <h3>Agenda des Départs du Jour</h3>
            <button type="button" onClick={() => setCurrentModule('plannings')}>Tous les trajets</button>
          </div>
          {plannings.length === 0 ? (
            <div className="empty-table">Aucun départ programmé aujourd'hui.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plannings.slice(0, 3).map((p) => (
                <div key={p.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#082b70' }}>{p.heure} • {p.destination}</strong>
                    <span className="badge green">{p.statut}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Chauffeur : {p.chauffeur} • {p.vehicule}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promo / WhatsApp Assistance Card */}
        <div className="panel promo">
          <div style={{ padding: '8px 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f7941d', textTransform: 'uppercase' }}>CENTRALE DE DISPATCH 24/7</span>
            <h4 style={{ margin: '6px 0 8px', color: '#082b70', fontSize: '16px' }}>Assistance Flotte & Chauffeurs</h4>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Coordination permanente avec l'équipe de régulation routière pour les trajets Port-au-Prince et provinces.
            </p>
            <div className="check" style={{ marginTop: '10px' }}>✓ Chauffeurs assermentés connectés</div>
            <div className="check">✓ Suivi radio et géolocalisation active</div>
            <a 
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-btn"
              style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: '14px' }}
            >
              Ouvrir le Dispatch WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
