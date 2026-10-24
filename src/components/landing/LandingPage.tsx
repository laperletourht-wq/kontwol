import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { setAuthModalOpen, setAuthView, saveReservation, showToast, setIsPublicLanding, settings } = useApp();
  const { user, profile } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Quote Simulator state
  const [selectedService, setSelectedService] = useState('tourisme');
  const [selectedDepart, setSelectedDepart] = useState('Port-au-Prince Centre');
  const [selectedDestination, setSelectedDestination] = useState('Côte des Arcadins');
  const [selectedPassengers, setSelectedPassengers] = useState('1-2');
  const [clientName, setClientName] = useState(profile?.nom || user?.displayName || '');
  const [clientPhone, setClientPhone] = useState(profile?.telephone || '');
  const [tripDate, setTripDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });

  // Interactive price calculation
  const calculatePrice = () => {
    let base = 120;
    if (selectedService === 'vip') base = 250;
    if (selectedService === 'scolaire') base = 150;
    if (selectedService === 'aeroport') base = 75;
    if (selectedService === 'corporate') base = 300;
    if (selectedService === 'course') base = 40;

    if (selectedDestination.includes('Citadelle') || selectedDestination.includes('Cap-Haïtien')) base += 220;
    else if (selectedDestination.includes('Bassin Bleu') || selectedDestination.includes('Jacmel')) base += 140;
    else if (selectedDestination.includes('Côte des Arcadins')) base += 90;
    else if (selectedDestination.includes('Kenscoff')) base += 60;

    if (selectedPassengers === '3-5') base = Math.round(base * 1.25);
    else if (selectedPassengers === '6-12') base = Math.round(base * 1.6);
    else if (selectedPassengers === '13-25') base = Math.round(base * 2.2);

    const usd = base;
    const htg = Math.round(usd * (settings.tauxChangeUSD_HTG || 132));
    return { usd, htg };
  };

  const { usd, htg } = calculatePrice();

  const getServiceLabel = (code: string) => {
    switch (code) {
      case 'tourisme': return 'Circuit Touristique & Découverte';
      case 'vip': return 'Location SUV / Berline VIP avec Chauffeur';
      case 'scolaire': return 'Abonnement Transport Scolaire Sécurisé';
      case 'aeroport': return 'Transfert Aéroport Toussaint Louverture';
      case 'corporate': return 'Transport Corporate & Missions d\'Entreprise';
      case 'course': return 'Course Privée Urbaine & Taxi VIP';
      default: return 'Prestation sur mesure';
    }
  };

  const getWhatsAppLink = (customName?: string, customPhone?: string) => {
    const nom = customName || clientName || 'Client Laperle';
    const tel = customPhone || clientPhone || 'Non précisé';
    const text = encodeURIComponent(
      `Bonjour LAPERLE TOUR HT, je souhaite valider un devis pour mon déplacement :\n` +
      `- Nom : ${nom}\n` +
      `- Téléphone : ${tel}\n` +
      `- Prestation : ${getServiceLabel(selectedService)}\n` +
      `- Date souhaitée : ${tripDate}\n` +
      `- Départ : ${selectedDepart}\n` +
      `- Destination : ${selectedDestination}\n` +
      `- Passagers : ${selectedPassengers}\n` +
      `- Estimation tarifaire : $${usd} USD (~${htg.toLocaleString()} HTG)\n\n` +
      `Merci de me confirmer la disponibilité d'un chauffeur et d'un véhicule.`
    );
    const waNumber = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '50944408687';
    return `https://wa.me/${waNumber}?text=${text}`;
  };

  // Frictionless Validation Flow
  const handleValidateQuote = async () => {
    const finalName = clientName.trim() || user?.displayName || user?.email?.split('@')[0] || 'Client Laperle';
    const finalPhone = clientPhone.trim() || '';

    const newRes = {
      client: finalName,
      telephone: finalPhone,
      service: getServiceLabel(selectedService),
      origin: selectedDepart,
      destination: selectedDestination,
      passengers: parseInt(selectedPassengers.split('-')[0], 10) || 1,
      date: tripDate,
      time: '09:00',
      amount: usd,
      currency: 'USD' as const,
      status: 'En attente' as const
    };

    await saveReservation(newRes);
    showToast(`Votre demande de devis a été enregistrée avec succès ! Ouverture de votre confirmation WhatsApp...`, 'success');

    // Smooth redirection to WhatsApp with pre-filled message
    window.open(getWhatsAppLink(finalName, finalPhone), '_blank');
  };

  const selectServiceForQuote = (svc: string) => {
    setSelectedService(svc);
    const devisElem = document.getElementById('plDevis');
    if (devisElem) {
      devisElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    setMobileDrawerOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="public-landing-page" style={{ display: 'block' }}>
      {/* 1. Barre de navigation officielle LAPERLE TOUR HT */}
      <header className="pl-navbar">
        <div className="pl-nav-inner">
          <a href="#plHero" className="pl-nav-brand" title="LAPERLE TOUR HT - Accueil" onClick={(e) => { e.preventDefault(); scrollToSection('plHero'); }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #082b70 0%, #05183d 100%)', border: '1.5px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 900, fontFamily: 'serif', fontSize: '15px', flexShrink: 0 }}>
              LT
            </div>
            <div className="pl-brand-text">
              <span className="pl-brand-name">LAPERLE <em>TOUR HT</em></span>
              <span className="pl-brand-slogan">« Un coup d'œil sur Haïti »</span>
            </div>
          </a>

          <nav className="pl-nav-menu">
            <a href="#plHero" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plHero'); }}>Accueil</a>
            <a href="#plServices" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plServices'); }}>Nos Services</a>
            <a href="#plFlotte" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plFlotte'); }}>Notre Flotte</a>
            <a href="#plDevis" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plDevis'); }}>Simulateur de Devis</a>
            <a href="#plEngagements" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plEngagements'); }}>Pourquoi Laperle</a>
            <a href="#plContact" className="pl-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('plContact'); }}>Contact</a>
          </nav>

          <div className="pl-nav-actions">
            {user ? (
              <button 
                type="button" 
                className="pl-btn-primary pl-nav-desktop-btn" 
                onClick={() => setIsPublicLanding(false)}
                title="Accéder au Centre de Contrôle"
              >
                Centre de Contrôle ➔
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="pl-btn-secondary pl-nav-desktop-btn" 
                  onClick={() => { setAuthView('login'); setAuthModalOpen(true); }}
                  title="Accéder à votre espace sécurisé"
                >
                  Connexion
                </button>
                <button 
                  type="button" 
                  className="pl-btn-primary pl-nav-desktop-btn" 
                  onClick={() => { setAuthView('register'); setAuthModalOpen(true); }}
                  title="Créer un compte en 1 minute"
                >
                  S'inscrire
                </button>
              </>
            )}
            <button 
              type="button" 
              className="pl-mobile-toggle" 
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)} 
              aria-label={mobileDrawerOpen ? "Fermer le menu mobile" : "Ouvrir le menu mobile"}
            >
              {mobileDrawerOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div className={`pl-mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`} style={{ display: mobileDrawerOpen ? 'block' : 'none' }}>
          <a href="#plHero" className="pl-nav-link" onClick={() => scrollToSection('plHero')}>Accueil</a>
          <a href="#plServices" className="pl-nav-link" onClick={() => scrollToSection('plServices')}>Nos Services</a>
          <a href="#plFlotte" className="pl-nav-link" onClick={() => scrollToSection('plFlotte')}>Notre Flotte</a>
          <a href="#plDevis" className="pl-nav-link" onClick={() => scrollToSection('plDevis')}>Simulateur de Devis</a>
          <a href="#plEngagements" className="pl-nav-link" onClick={() => scrollToSection('plEngagements')}>Pourquoi Laperle</a>
          <a href="#plContact" className="pl-nav-link" onClick={() => scrollToSection('plContact')}>Contact</a>
          <div className="pl-nav-actions" style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            {user ? (
              <button type="button" className="pl-btn-primary" onClick={() => { setIsPublicLanding(false); setMobileDrawerOpen(false); }}>
                Centre de Contrôle ➔
              </button>
            ) : (
              <>
                <button type="button" className="pl-btn-secondary" onClick={() => { setAuthView('login'); setAuthModalOpen(true); setMobileDrawerOpen(false); }}>Connexion</button>
                <button type="button" className="pl-btn-primary" onClick={() => { setAuthView('register'); setAuthModalOpen(true); setMobileDrawerOpen(false); }}>S'inscrire</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pl-hero" id="plHero">
        <div className="pl-hero-container">
          <div className="pl-hero-content">
            <div className="pl-hero-kicker">
              <span>★</span> TRANSPORT VIP & CIRCUITS D'EXCEPTION
            </div>
            <h1 className="pl-hero-title">
              Voyagez avec Excellence en Haïti avec <span className="pl-hero-title-accent">LAPERLE TOUR HT</span>
            </h1>
            <div className="pl-hero-slogan">« Un coup d'œil sur Haïti »</div>
            <p className="pl-hero-desc">
              SUV de prestige, chauffeurs privés assermentés, circuits touristiques et navettes sécurisées 24h/24 à travers les dix départements.
            </p>

            {/* Zero-Pill Discipline Metadata */}
            <div className="pl-hero-meta">
              <span>🛡️ Sécurité certifiée</span>
              <span className="pl-meta-sep">·</span>
              <span>💺 Confort VIP</span>
              <span className="pl-meta-sep">·</span>
              <span>⏱️ Ponctualité 24/7</span>
              <span className="pl-meta-sep">·</span>
              <span>🇭🇹 Chauffeurs dédiés</span>
            </div>

            <div className="pl-hero-actions">
              <button 
                type="button" 
                className="pl-hero-btn-primary" 
                onClick={() => scrollToSection('plDevis')}
              >
                <span>Planifier mon voyage</span> <span>➔</span>
              </button>
              <button 
                type="button"
                onClick={() => scrollToSection('plDevis')}
                className="pl-hero-btn-secondary"
              >
                <span>Simulateur de Devis Instantané</span> <span>↓</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Simulateur Interactif de Devis & Réservation Sans Friction */}
      <section className="pl-simulator-wrapper" id="plDevis">
        <div className="pl-simulator-card">
          <div className="pl-sim-header">
            <div className="pl-sim-title-group">
              <h3><span>🏷️</span> Simulateur de Réservation & Demande de Devis Direct</h3>
              <p>Configurez votre trajet, renseignez vos coordonnées et recevez instantanément votre devis officiel sur mesure.</p>
            </div>
            <span className="pl-sim-badge">Devis officiel instantané</span>
          </div>

          <div className="pl-sim-grid">
            <div className="pl-sim-field">
              <label htmlFor="plSimService"><span>📋</span> Prestation souhaitée :</label>
              <select 
                id="plSimService" 
                className="pl-sim-select" 
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="tourisme">Circuit Touristique & Découverte</option>
                <option value="vip">Location SUV / Berline VIP avec Chauffeur</option>
                <option value="scolaire">Abonnement Transport Scolaire Sécurisé</option>
                <option value="aeroport">Transfert Aéroport Toussaint Louverture</option>
                <option value="corporate">Transport Corporate & Missions d'Entreprise / ONG</option>
                <option value="course">Course Privée Urbaine & Taxi VIP</option>
              </select>
            </div>

            <div className="pl-sim-field">
              <label htmlFor="plSimDepart"><span>📍</span> Point de départ :</label>
              <select 
                id="plSimDepart" 
                className="pl-sim-select"
                value={selectedDepart}
                onChange={(e) => setSelectedDepart(e.target.value)}
              >
                <option value="Port-au-Prince Centre">Port-au-Prince (Centre-ville)</option>
                <option value="Pétion-Ville">Pétion-Ville</option>
                <option value="Delmas">Delmas</option>
                <option value="Aéroport Toussaint Louverture">Aéroport Toussaint Louverture</option>
                <option value="Tabarre">Tabarre</option>
                <option value="Cap-Haïtien">Cap-Haïtien</option>
                <option value="Jacmel">Jacmel</option>
                <option value="Autre commune">Autre commune</option>
              </select>
            </div>

            <div className="pl-sim-field">
              <label htmlFor="plSimDestination"><span>🎯</span> Destination :</label>
              <select 
                id="plSimDestination" 
                className="pl-sim-select"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
              >
                <option value="Côte des Arcadins">Côte des Arcadins / Montrouis (Plages & Resorts)</option>
                <option value="Cap-Haïtien & Citadelle">Cap-Haïtien & Citadelle Laferrière</option>
                <option value="Jacmel & Bassin Bleu">Jacmel & Chutes de Bassin Bleu</option>
                <option value="Kenscoff & Furcy">Kenscoff & Furcy (Fraîcheur & Montagne)</option>
                <option value="Saut-d'Eau">Saut-d'Eau (Nature & Pèlerinage)</option>
                <option value="Pétion-Ville">Pétion-Ville (Trajet urbain)</option>
                <option value="Aéroport International">Aéroport Toussaint Louverture</option>
                <option value="Circuit personnalisé">Circuit personnalisé (Sur mesure)</option>
              </select>
            </div>

            <div className="pl-sim-field">
              <label htmlFor="plSimPassengers"><span>👥</span> Passagers :</label>
              <select 
                id="plSimPassengers" 
                className="pl-sim-select"
                value={selectedPassengers}
                onChange={(e) => setSelectedPassengers(e.target.value)}
              >
                <option value="1-2">1 à 2 passagers (Berline / SUV Privé)</option>
                <option value="3-5">3 à 5 passagers (Grand SUV Prado TXL)</option>
                <option value="6-12">6 à 12 passagers (Minibus HiAce VIP)</option>
                <option value="13-25">13 à 25 passagers (Autocar Confort)</option>
              </select>
            </div>

            {/* Nouveaux Champs de Contact Direct et Date (Frictionless UX) */}
            <div className="pl-sim-field">
              <label htmlFor="plSimDate"><span>📅</span> Date souhaitée du trajet :</label>
              <input
                id="plSimDate"
                type="date"
                className="pl-sim-select"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                style={{ background: '#fff' }}
              />
            </div>

            <div className="pl-sim-field">
              <label htmlFor="plSimClientName"><span>👤</span> Votre nom complet :</label>
              <input
                id="plSimClientName"
                type="text"
                className="pl-sim-select"
                placeholder="Ex: Jean-Marc Delacroix"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ background: '#fff' }}
              />
            </div>

            <div className="pl-sim-field pl-sim-field-full">
              <label htmlFor="plSimClientPhone"><span>📱</span> Numéro WhatsApp ou Téléphone :</label>
              <input
                id="plSimClientPhone"
                type="tel"
                className="pl-sim-select"
                placeholder="Ex: +509 4440 8687 ou 3700 0000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                style={{ background: '#fff' }}
              />
            </div>
          </div>

          {/* Résultat interactif calculé en direct */}
          <div className="pl-sim-result-box" id="plSimResultBox">
            <div className="pl-result-left">
              <span className="pl-result-kicker">DEVIS ESTIMATIF EN TEMPS RÉEL</span>
              <div className="pl-result-price-wrap" style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '6px 0' }}>
                <span className="pl-result-price-usd" style={{ fontSize: '28px', fontWeight: 800, color: '#082b70' }}>
                  ${usd} USD
                </span>
                <span className="pl-result-price-htg" style={{ fontSize: '16px', color: '#65758b', fontWeight: 600 }}>
                  ≈ {htg.toLocaleString()} HTG
                </span>
              </div>
              <div className="pl-result-inclusions" id="plSimInclusions">
                ✓ Chauffeur professionnel assermenté · ✓ Carburant inclus · ✓ Climatisation haute puissance · ✓ Assurance & Assistance 24/7
              </div>
            </div>

            <div className="pl-result-actions">
              <button type="button" className="pl-btn-validate-quote" onClick={handleValidateQuote}>
                <span>Valider & Réserver mon trajet</span> <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section : Présentation de nos Services */}
      <section className="pl-section" id="plServices">
        <div className="pl-section-head pl-services-head-wrap">
          <div style={{ maxWidth: '820px' }}>
            <div className="pl-section-kicker">NOS PRESTATIONS PHARES</div>
            <h2 className="pl-section-title">Une Offre Complète pour Tous vos Déplacements</h2>
            <p className="pl-section-sub">
              Que vous soyez un particulier, une famille, une délégation diplomatique ou une entreprise internationale, découvrez l'excellence opérationnelle LAPERLE TOUR HT.
            </p>
          </div>
        </div>

        <div className="pl-services-grid">
          {/* Service 1 : Circuits Touristiques */}
          <div className="pl-service-card">
            <div className="pl-service-img-wrap">
              <img src="/tourisme-haiti.jpg" alt="Circuits Touristiques en Haïti" className="pl-service-img" />
              <span className="pl-service-tag">Tourisme & Excursions</span>
            </div>
            <div className="pl-service-body">
              <h3 className="pl-service-title">Circuits Touristiques & Découverte d'Haïti</h3>
              <p className="pl-service-desc">
                Vivez une expérience inoubliable au cœur du patrimoine naturel et historique : Côte des Arcadins, Citadelle Laferrière, Jacmel, Bassin Bleu et les sommets de Kenscoff.
              </p>
              <ul className="pl-service-perks">
                <li>Guides bilingues certifiés & chauffeurs passionnés</li>
                <li>Véhicules 4x4 tout-terrain ou minibus climatisés</li>
                <li>Itinéraires sécurisés et rafraîchissements à bord</li>
                <li>Partenariats avec les meilleurs hôtels et restaurants</li>
              </ul>
              <div className="pl-service-foot">
                <div className="pl-service-price-from">
                  <span className="pl-service-price-label">À partir de</span>
                  <span className="pl-service-price-val">$120 USD / pers.</span>
                </div>
                <button type="button" className="pl-service-btn" onClick={() => selectServiceForQuote('tourisme')}>
                  Réserver ce circuit
                </button>
              </div>
            </div>
          </div>

          {/* Service 2 : Location VIP */}
          <div className="pl-service-card">
            <div className="pl-service-img-wrap">
              <img src="/vip-suv.jpg" alt="Location SUV VIP avec chauffeur" className="pl-service-img" />
              <span className="pl-service-tag">Prestige & Diplomatie</span>
            </div>
            <div className="pl-service-body">
              <h3 className="pl-service-title">Location de Véhicules VIP avec Chauffeur</h3>
              <p className="pl-service-desc">
                Flotte de berlines et SUV haut de gamme (Toyota Land Cruiser Prado TXL, Land Cruiser 300) pour diplomates, personnalités, mariages, délégations d'affaires et réceptions officielles.
              </p>
              <ul className="pl-service-perks">
                <li>Vitres teintées, intérieur cuir et insonorisation</li>
                <li>Chauffeurs en tenue protocolaire assermentés</li>
                <li>Mise à disposition à l'heure, à la journée ou au mois</li>
                <li>Discrétion absolue et sécurité renforcée</li>
              </ul>
              <div className="pl-service-foot">
                <div className="pl-service-price-from">
                  <span className="pl-service-price-label">À partir de</span>
                  <span className="pl-service-price-val">$250 USD / jour</span>
                </div>
                <button type="button" className="pl-service-btn" onClick={() => selectServiceForQuote('vip')}>
                  Demander un SUV VIP
                </button>
              </div>
            </div>
          </div>

          {/* Service 3 : Navette Scolaire */}
          <div className="pl-service-card">
            <div className="pl-service-img-wrap">
              <img src="/navette-scolaire.jpg" alt="Transport Scolaire Sécurisé" className="pl-service-img" />
              <span className="pl-service-tag">Scolaire & Famille</span>
            </div>
            <div className="pl-service-body">
              <h3 className="pl-service-title">Circuits & Navettes Scolaires Sécurisées</h3>
              <p className="pl-service-desc">
                Prise en charge quotidienne des élèves à domicile et dépose sécurisée aux collèges et lycées partenaires. La tranquillité d'esprit absolue pour tous les parents.
              </p>
              <ul className="pl-service-perks">
                <li>Prise en charge personnalisée au pas de la porte</li>
                <li>Ceintures de sécurité obligatoires et vitesse régulée</li>
                <li>Alertes quotidiennes aux parents via WhatsApp</li>
                <li>Abonnements mensuels et trimestriels dégressifs</li>
              </ul>
              <div className="pl-service-foot">
                <div className="pl-service-price-from">
                  <span className="pl-service-price-label">Abonnement dès</span>
                  <span className="pl-service-price-val">$150 USD / mois</span>
                </div>
                <button type="button" className="pl-service-btn" onClick={() => selectServiceForQuote('scolaire')}>
                  Inscrire mon enfant
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Flotte de Véhicules Haute Définition */}
      <section className="pl-section" id="plFlotte" style={{ background: '#f8fafc' }}>
        <div className="pl-section-head">
          <div className="pl-section-kicker">EXCELLENCE & SÉCURITÉ</div>
          <h2 className="pl-section-title">Notre Flotte de Prestige</h2>
          <p className="pl-section-sub">
            Des véhicules récents, inspectés régulièrement et conduits par des professionnels assermentés.
          </p>
        </div>

        <div className="pl-flotte-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', padding: '0 20px', maxWidth: '1280px', margin: '0 auto' }}>
          {/* Véhicule 1 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(8,43,112,0.06)' }}>
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
              <img src="/vip-suv.jpg" alt="Toyota Prado TXL" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(8,43,112,0.85)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>VIP & Diplomatique</span>
            </div>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 6px', color: '#082b70', fontSize: '18px' }}>Toyota Land Cruiser Prado TXL</h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>Capacité : 5 passagers • Climatisation bizone • 4x4 tout-terrain • Finition cuir • Vitres teintées</p>
              <button type="button" className="pl-service-btn" style={{ width: '100%' }} onClick={() => selectServiceForQuote('vip')}>
                Réserver ce SUV VIP
              </button>
            </div>
          </div>

          {/* Véhicule 2 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(8,43,112,0.06)' }}>
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
              <img src="/hero-laperle.jpg" alt="Toyota HiAce VIP Grand Cabin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(247,148,29,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Groupes & Délégations</span>
            </div>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 6px', color: '#082b70', fontSize: '18px' }}>Toyota HiAce Grand Cabin VIP</h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>Capacité : 12 passagers • Sièges inclinables • Grand coffre bagages • Wi-Fi embarqué • Climatisation puissante</p>
              <button type="button" className="pl-service-btn" style={{ width: '100%' }} onClick={() => selectServiceForQuote('tourisme')}>
                Réserver ce Minibus
              </button>
            </div>
          </div>

          {/* Véhicule 3 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(8,43,112,0.06)' }}>
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
              <img src="/navette-scolaire.jpg" alt="Toyota Coaster Navette Scolaire" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(37,168,82,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Ramassage Scolaire</span>
            </div>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 6px', color: '#082b70', fontSize: '18px' }}>Toyota Coaster Navette Scolaire</h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>Capacité : 28 élèves • Ceintures individuelles • Accompagnatrice de bord • Suivi GPS temps réel</p>
              <button type="button" className="pl-service-btn" style={{ width: '100%' }} onClick={() => selectServiceForQuote('scolaire')}>
                Inscrire un Élève
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Engagements & Pourquoi Laperle */}
      <section className="pl-section" id="plEngagements">
        <div className="pl-section-head">
          <div className="pl-section-kicker">POURQUOI CHOISIR LAPERLE TOUR HT</div>
          <h2 className="pl-section-title">Les 4 Piliers de Notre Engagement</h2>
          <p className="pl-section-sub">Une rigueur opérationnelle sans faille pour votre sérénité totale en Haïti.</p>
        </div>

        <div className="pl-engagements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛡️</div>
            <h4 style={{ color: '#082b70', margin: '0 0 8px', fontSize: '17px' }}>Sécurité & Chauffeurs Assermentés</h4>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Tous nos conducteurs font l'objet d'enquêtes de sécurité approfondies et d'un entraînement continu à la conduite préventive.
            </p>
          </div>

          <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏱️</div>
            <h4 style={{ color: '#082b70', margin: '0 0 8px', fontSize: '17px' }}>Ponctualité Rigoureuse 24/7</h4>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Anticipation constante des axes routiers et régulation en direct par notre centre de contrôle opérationnel à Delmas.
            </p>
          </div>

          <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
            <h4 style={{ color: '#082b70', margin: '0 0 8px', fontSize: '17px' }}>Facturation Conforme DGI</h4>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Proformas transparentes, factures officielles avec mentions fiscales haïtiennes, devises USD et HTG adaptées à vos exigences.
            </p>
          </div>

          <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
            <h4 style={{ color: '#082b70', margin: '0 0 8px', fontSize: '17px' }}>Support Dédié WhatsApp</h4>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Un interlocuteur direct disponible 24h/24 pour ajuster vos horaires, ajouter un passager ou planifier une mission urgente.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Contact Section */}
      <section className="pl-section" id="plContact" style={{ background: 'linear-gradient(180deg, #07255e 0%, #0d3b87 100%)', color: '#fff', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#f7941d' }}>CONTACT DIRECT & DISPATCH</span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '12px 0 16px', color: '#fff' }}>Planifiez Votre Prochain Déplacement</h2>
          <p style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 30px' }}>
            Nos conseillers sont à votre écoute pour organiser votre transport à Port-au-Prince et dans tout le pays.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#25d366', color: '#fff', padding: '14px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
              <span>💬</span> <span>WhatsApp Direct ({settings.whatsapp})</span>
            </a>
            <a href={`mailto:${settings.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '14px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
              <span>✉️</span> <span>{settings.email}</span>
            </a>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '24px', fontSize: '13px', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 6px' }}><strong>LAPERLE TOUR HT</strong> • Delmas 75, Port-au-Prince, Haïti</p>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} LAPERLE TOUR HT. Tous droits réservés. « Un coup d'œil sur Haïti ».</p>
          </div>
        </div>
      </section>
    </div>
  );
};
