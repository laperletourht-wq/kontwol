import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UniversalFooter } from '../common/UniversalFooter';
import { subscribeTemoignages, addTemoignage, deleteTemoignage, SEED_TEMOIGNAGES } from '../../../services/temoignages';
import type { Temoignage } from '../../types';

export const LandingPage: React.FC = () => {
  const { setAuthModalOpen, setAuthView, saveReservation, showToast, setIsPublicLanding, settings } = useApp();
  const { user, profile, role, isSuperAdmin } = useAuth();
  const isAdmin = isSuperAdmin || role === 'admin' || role === 'direction';

  // Testimonials & Reviews state (Témoignages dynamiques)
  const [temoignages, setTemoignages] = useState<Temoignage[]>(SEED_TEMOIGNAGES);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [commentNom, setCommentNom] = useState<string>('');
  const [commentTitre, setCommentTitre] = useState<string>('');
  const [commentEtoiles, setCommentEtoiles] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Real-time synchronization of testimonials from Firestore
  useEffect(() => {
    const unsub = subscribeTemoignages((list) => {
      setTemoignages(list);
    });
    return () => unsub();
  }, []);

  const handleOpenCommentModal = () => {
    if (!user) {
      setAuthView('login');
      setAuthModalOpen(true);
      showToast('Connectez-vous ou créez un compte pour laisser votre avis.', 'info');
      return;
    }
    const defaultName = profile?.nom || profile?.name || user.displayName || user.email?.split('@')[0] || '';
    setCommentNom(defaultName);
    setCommentTitre(profile?.societe ? `Client • ${profile.societe}` : 'Client vérifié');
    setCommentEtoiles(5);
    setCommentText('');
    setShowCommentModal(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Vous devez posséder un compte pour ajouter un commentaire.', 'error');
      return;
    }
    if (!commentText.trim()) {
      showToast('Veuillez saisir votre commentaire.', 'warning');
      return;
    }
    const finalNom = commentNom.trim() || user.displayName || user.email?.split('@')[0] || 'Client Laperle';

    setSubmittingComment(true);
    try {
      await addTemoignage({
        nom: finalNom,
        titre: commentTitre.trim() || 'Client vérifié',
        etoiles: commentEtoiles,
        commentaire: commentText.trim()
      });
      showToast('Votre commentaire a été publié avec succès !', 'success');
      setShowCommentModal(false);
      setCommentText('');
    } catch (err: any) {
      console.error('Erreur ajout commentaire:', err);
      showToast(`Impossible de publier votre avis : ${err?.message || 'Erreur'}`, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (id: string, authorName: string) => {
    if (!isAdmin) {
      showToast('Seul un administrateur peut effacer un commentaire.', 'error');
      return;
    }
    if (!window.confirm(`Voulez-vous supprimer définitivement l'avis de ${authorName} ?`)) {
      return;
    }
    setDeletingCommentId(id);
    try {
      await deleteTemoignage(id);
      showToast('Commentaire supprimé par l\'administrateur.', 'success');
    } catch (err: any) {
      console.error('Erreur suppression commentaire:', err);
      showToast(`Échec de la suppression : ${err?.message || 'Droits insuffisants'}`, 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Quote Simulator state (Option B & D)
  const [selectedService, setSelectedService] = useState('tourisme');
  const [selectedDepart, setSelectedDepart] = useState('Port-au-Prince Centre');
  const [selectedDestination, setSelectedDestination] = useState('Côte des Arcadins');
  const [selectedPassengers, setSelectedPassengers] = useState('1-2');
  const [tripType, setTripType] = useState<'simple' | 'aller_retour' | 'journee'>('simple');
  const [bagages, setBagages] = useState<'standard' | 'volumineux'>('standard');
  const [siegeEnfant, setSiegeEnfant] = useState<boolean>(false);
  const [clientName, setClientName] = useState(profile?.nom || user?.displayName || '');
  const [clientPhone, setClientPhone] = useState(profile?.telephone || '');
  const [tripDate, setTripDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });

  // Interactive price calculation (Option B & D)
  const calculatePrice = () => {
    let base = 120;
    if (selectedService === 'tourisme') base = Number(settings.tarifBaseTourisme) || 120;
    else if (selectedService === 'vip') base = Number(settings.tarifBaseVip) || 250;
    else if (selectedService === 'scolaire') base = Number(settings.tarifBaseScolaire) || 150;
    else if (selectedService === 'aeroport') base = 75;
    else if (selectedService === 'corporate') base = 300;
    else if (selectedService === 'course') base = 40;

    // Destination supplements
    if (selectedDestination.includes('Citadelle') || selectedDestination.includes('Cap-Haïtien')) base += 220;
    else if (selectedDestination.includes('Bassin Bleu') || selectedDestination.includes('Jacmel')) base += 140;
    else if (selectedDestination.includes('Côte des Arcadins')) base += 90;
    else if (selectedDestination.includes('Kenscoff')) base += 60;

    // Passengers multiplier
    if (selectedPassengers === '3-5') base = Math.round(base * 1.25);
    else if (selectedPassengers === '6-12') base = Math.round(base * 1.6);
    else if (selectedPassengers === '13-25') base = Math.round(base * 2.2);

    // Trip type adjustments (Option B)
    if (tripType === 'aller_retour') {
      base = Math.round(base * 1.85); // 15% discount on return leg
    } else if (tripType === 'journee') {
      base = Math.round(base * 1.6); // Full-day disposition
    }

    // Additional options (Option B)
    if (bagages === 'volumineux') base += 15;
    if (siegeEnfant) base += 10;

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

  const getTripTypeLabel = (type: 'simple' | 'aller_retour' | 'journee') => {
    switch (type) {
      case 'aller_retour': return 'Aller-Retour';
      case 'journee': return 'Mise à disposition Journée Complète';
      case 'simple':
      default: return 'Aller simple';
    }
  };

  const getWhatsAppLink = (customName?: string, customPhone?: string) => {
    const nom = customName || clientName || 'Client Laperle';
    const tel = customPhone || clientPhone || 'Non précisé';
    const text = encodeURIComponent(
      `Bonjour LAPERLE TOUR HT, je souhaite recevoir un devis officiel (Proforma) pour mon déplacement :\n` +
      `- Nom : ${nom}\n` +
      `- Téléphone : ${tel}\n` +
      `- Prestation : ${getServiceLabel(selectedService)}\n` +
      `- Formule : ${getTripTypeLabel(tripType)}\n` +
      `- Date souhaitée : ${tripDate}\n` +
      `- Départ : ${selectedDepart}\n` +
      `- Destination : ${selectedDestination}\n` +
      `- Passagers : ${selectedPassengers}\n` +
      `- Bagages : ${bagages === 'volumineux' ? 'Volumineux / Matériel' : 'Standards / Cabine'}\n` +
      `- Siège enfant : ${siegeEnfant ? 'Oui' : 'Non'}\n\n` +
      `Merci de m'adresser mon Devis Proforma officiel sur WhatsApp et dans mon espace client.`
    );
    const waNumber = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '50944408687';
    return `https://wa.me/${waNumber}?text=${text}`;
  };

  // Frictionless Validation Flow (Sends official quote request via WhatsApp and creates reservation record)
  const handleValidateQuote = async () => {
    const finalName = clientName.trim() || user?.displayName || user?.email?.split('@')[0] || 'Client Laperle';
    const finalPhone = clientPhone.trim() || '';

    const newRes = {
      client: finalName,
      telephone: finalPhone,
      service: `${getServiceLabel(selectedService)} (${getTripTypeLabel(tripType)})`,
      origin: selectedDepart,
      destination: selectedDestination,
      passengers: parseInt(selectedPassengers.split('-')[0], 10) || 1,
      date: tripDate,
      time: '09:00',
      amount: usd, // Internal base estimate for proforma generation
      currency: 'USD' as const,
      status: 'En attente' as const,
      demandeDevis: true,
      notes: `Demande de Devis Proforma via WhatsApp (${finalPhone || 'Non précisé'}) | Formule: ${getTripTypeLabel(tripType)} | Bagages: ${bagages === 'volumineux' ? 'Volumineux' : 'Standard'} | Siège enfant: ${siegeEnfant ? 'Oui' : 'Non'}`
    };

    await saveReservation(newRes);
    showToast(`Votre demande de devis proforma a été enregistrée avec succès ! Ouverture de votre confirmation WhatsApp...`, 'success');

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
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="public-landing-page" style={{ display: 'block' }}>
      {/* 0. Bandeau d'Annonce Promotionnelle Dynamique CMS (Option D) */}
      {settings.bannierePromoActive && settings.bannierePromoTexte && (
        <aside aria-label="Annonce promotionnelle" style={{
          background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 50%, #f97316 100%)',
          color: '#ffffff',
          padding: '9px 18px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(194, 65, 12, 0.25)',
          position: 'relative',
          zIndex: 40
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {settings.bannierePromoTexte}
          </span>
          <button
            type="button"
            onClick={() => scrollToSection('plDevis')}
            style={{
              background: '#ffffff',
              color: '#c2410c',
              border: 'none',
              borderRadius: '20px',
              padding: '3px 12px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            Simuler mon devis ➔
          </button>
        </aside>
      )}

      {/* 1. Barre de navigation officielle LAPERLE TOUR HT */}
      <header className="pl-navbar">
        <div className="pl-nav-inner">
          <a href="#plHero" className="pl-nav-brand" title="LAPERLE TOUR HT - Accueil" onClick={(e) => { e.preventDefault(); scrollToSection('plHero'); }}>
            <div className="brand-logo-circle" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', padding: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
            </div>
            <div className="pl-brand-text">
              <span className="pl-brand-name">LAPERLE <em>TOUR HT</em></span>
              <span className="pl-brand-slogan">« Un coup d'œil sur Haïti »</span>
            </div>
          </a>

          {/* Menu links masked per user instruction */}

          <div className="pl-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <button 
                type="button" 
                className="pl-btn-primary" 
                onClick={() => setIsPublicLanding(false)}
                title="Accéder au Centre de Contrôle"
              >
                Centre de Contrôle ➔
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="pl-btn-secondary" 
                  onClick={() => { setAuthView('login'); setAuthModalOpen(true); }}
                  title="Accéder à votre espace sécurisé"
                >
                  Connexion
                </button>
                <button 
                  type="button" 
                  className="pl-btn-primary" 
                  onClick={() => { setAuthView('register'); setAuthModalOpen(true); }}
                  title="Créer un compte en 1 minute"
                >
                  S'inscrire
                </button>
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

            {/* Option B : Formule & Type de trajet */}
            <div className="pl-sim-field">
              <label htmlFor="plSimTripType"><span>🔄</span> Formule de trajet :</label>
              <select 
                id="plSimTripType" 
                className="pl-sim-select"
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
              >
                <option value="simple">Aller simple (Trajet direct)</option>
                <option value="aller_retour">Aller-Retour</option>
                <option value="journee">Mise à disposition Journée (8h - 18h)</option>
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

            {/* Option B : Bagages */}
            <div className="pl-sim-field">
              <label htmlFor="plSimBagages"><span>🧳</span> Bagages & Équipements :</label>
              <select
                id="plSimBagages"
                className="pl-sim-select"
                value={bagages}
                onChange={(e) => setBagages(e.target.value as any)}
              >
                <option value="standard">Standards / Valises cabines (Inclus)</option>
                <option value="volumineux">Bagages volumineux / Matériel</option>
              </select>
            </div>

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

            {/* Option B : Siège enfant */}
            <div className="pl-sim-field" style={{ justifyContent: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={siegeEnfant}
                  onChange={(e) => setSiegeEnfant(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#ea580c', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 650, color: '#1e293b' }}>
                  👶 Siège auto enfant homologué
                </span>
              </label>
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

            <div className="pl-sim-field">
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

          {/* Résultat interactif : Envoi direct du Devis Proforma sans affichage de prix public */}
          <div className="pl-sim-result-box" id="plSimResultBox">
            <div className="pl-result-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="pl-result-kicker">DEVIS OFFICIEL SUR MESURE</span>
                {tripType === 'aller_retour' && (
                  <span style={{ background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                    Formule : Aller-Retour
                  </span>
                )}
                {tripType === 'journee' && (
                  <span style={{ background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                    Mise à disposition Journée
                  </span>
                )}
                {bagages === 'volumineux' && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    Bagages volumineux
                  </span>
                )}
                {siegeEnfant && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    Siège auto enfant
                  </span>
                )}
              </div>

              <div style={{ margin: '8px 0 10px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📑</span> Devis Proforma Personnalisé
                </h4>
                <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, fontWeight: 500, lineHeight: '1.5', maxWidth: '640px' }}>
                  Renseignez vos coordonnées : votre <strong>Devis Proforma officiel chiffré</strong> vous est transmis instantanément par <strong>WhatsApp</strong> et dans votre <strong>Espace Client</strong> sans aucun engagement.
                </p>
              </div>

              <div className="pl-result-inclusions" id="plSimInclusions">
                ✓ Chauffeur professionnel assermenté · ✓ Véhicule climatisé haut de gamme · ✓ Carburant inclus · ✓ Assistance & Assurance 24/7
              </div>
            </div>

            <div className="pl-result-actions">
              <button type="button" className="pl-btn-validate-quote" onClick={handleValidateQuote}>
                <span>Recevoir mon Devis Proforma Gratuit</span> <span>➔</span>
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
                  <span className="pl-service-price-label">Tarification</span>
                  <span className="pl-service-price-val" style={{ fontSize: '15px', color: '#082b70', fontWeight: 800 }}>Sur devis officiel</span>
                </div>
                <button type="button" className="pl-service-btn" onClick={() => selectServiceForQuote('tourisme')}>
                  Demander un devis
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
                  <span className="pl-service-price-label">Tarification</span>
                  <span className="pl-service-price-val" style={{ fontSize: '15px', color: '#082b70', fontWeight: 800 }}>Sur devis officiel</span>
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
                  <span className="pl-service-price-label">Formule</span>
                  <span className="pl-service-price-val" style={{ fontSize: '15px', color: '#082b70', fontWeight: 800 }}>Sur devis officiel</span>
                </div>
                <button type="button" className="pl-service-btn" onClick={() => selectServiceForQuote('scolaire')}>
                  Demander un devis
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

      {/* 6. Option A : Preuve Sociale & Avis Clients (5/5 Étoiles) */}
      <section className="pl-section" id="plTestimonials" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div className="pl-section-head">
          <div className="pl-section-kicker" style={{ color: '#ea580c' }}>
            ★ ★ ★ ★ ★ &nbsp; 4.9 / 5 · PLUS DE 350 MISSIONS ACCOMPLIES
          </div>
          <h2 className="pl-section-title">Ce que nos Clients et Partenaires disent de Nous</h2>
          <p className="pl-section-sub">
            Diplomates, directions d'ONG, parents d'élèves et voyageurs de la diaspora témoignent de notre ponctualité, discrétion et excellence opérationnelle.
          </p>

          {/* Bouton pour ajouter un commentaire (Accessible à toute personne ayant un compte) */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleOpenCommentModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: user ? '#082b70' : '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 22px',
                fontSize: '13.5px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(8,43,112,0.18)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>✍️</span>
              {user ? 'Ajouter mon avis / commentaire' : 'Se connecter pour ajouter un commentaire'}
            </button>
          </div>
        </div>

        {/* Grille dynamique des Témoignages & Avis Clients */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          padding: '0 20px',
          maxWidth: '1280px',
          margin: '0 auto 48px'
        }}>
          {temoignages.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(8,43,112,0.04)',
                position: 'relative'
              }}
            >
              {/* Seul l'administrateur peut effacer un commentaire */}
              {isAdmin && (
                <button
                  type="button"
                  title="Effacer ce commentaire (Action Administrateur)"
                  disabled={deletingCommentId === t.id}
                  onClick={() => handleDeleteComment(t.id, t.nom)}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>🗑️</span> Effacer
                </button>
              )}

              <div>
                <div style={{ color: '#f59e0b', fontSize: '16px', letterSpacing: '2px', marginBottom: '12px' }}>
                  {'★'.repeat(t.etoiles || 5)}
                  {'☆'.repeat(Math.max(0, 5 - (t.etoiles || 5)))}
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155', fontStyle: 'italic', margin: '0 0 16px', whiteSpace: 'pre-line' }}>
                  {t.commentaire.startsWith('«') ? t.commentaire : `« ${t.commentaire} »`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#082b70',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {t.initiales || t.nom.slice(0, 2).toUpperCase() || 'CL'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {t.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {t.titre || 'Client Laperle Tour'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal d'ajout de commentaire / avis (Accessible aux membres connectés) */}
        {showCommentModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(4, 22, 57, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setShowCommentModal(false)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ background: '#082b70', color: '#ffffff', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>✍️ Ajouter un avis & commentaire</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#93c5fd' }}>Votre témoignage sera visible sur la vitrine officielle</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitComment} style={{ padding: '24px' }}>
                {/* Note en étoiles */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Votre évaluation globale :
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setCommentEtoiles(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '24px',
                          cursor: 'pointer',
                          color: star <= commentEtoiles ? '#f59e0b' : '#cbd5e1',
                          padding: '0 2px',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#082b70', marginLeft: '6px' }}>
                      {commentEtoiles} / 5 étoiles
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Votre nom complet :
                  </label>
                  <input
                    type="text"
                    required
                    value={commentNom}
                    onChange={(e) => setCommentNom(e.target.value)}
                    placeholder="Ex: Jean-Marc Delacroix"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Votre titre ou organisation (facultatif) :
                  </label>
                  <input
                    type="text"
                    value={commentTitre}
                    onChange={(e) => setCommentTitre(e.target.value)}
                    placeholder="Ex: Client régulier • Directeur d'ONG • Parent d'élève"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Votre commentaire / témoignage :
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Racontez votre expérience avec nos chauffeurs, la ponctualité, le confort de nos véhicules..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCommentModal(false)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontWeight: 650,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComment}
                    style={{
                      background: '#082b70',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontWeight: 750,
                      cursor: submittingComment ? 'not-allowed' : 'pointer',
                      opacity: submittingComment ? 0.7 : 1
                    }}
                  >
                    {submittingComment ? 'Publication...' : 'Publier mon avis ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. Option A : Bandeau des Partenaires & Institutions de Confiance */}
        <div style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '40px 20px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h4 style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#64748b',
              fontWeight: 800,
              margin: '0 0 24px'
            }}>
              PARTENAIRE LOGISTIQUE PRIVILÉGIÉ DES INSTITUTIONS EN HAÏTI
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🏛️</div>
                <div style={{ fontWeight: 750, color: '#082b70', fontSize: '13.5px' }}>Corps Diplomatique</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Ambassades & Consulats</div>
              </div>
              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🌐</div>
                <div style={{ fontWeight: 750, color: '#082b70', fontSize: '13.5px' }}>ONG Internationales</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Missions terrain & Agences UN</div>
              </div>
              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎓</div>
                <div style={{ fontWeight: 750, color: '#082b70', fontSize: '13.5px' }}>Établissements Partenaires</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Collèges & Lycées de référence</div>
              </div>
              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🏨</div>
                <div style={{ fontWeight: 750, color: '#082b70', fontSize: '13.5px' }}>Resorts & Hôtels</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Moulin Sur Mer • Karibe • Decameron</div>
              </div>
              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>✈️</div>
                <div style={{ fontWeight: 750, color: '#082b70', fontSize: '13.5px' }}>Aéroport Toussaint Louverture</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Transferts VIP 24h/24</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pied de page universel Laperle Tour HT */}
      <UniversalFooter variant="public" />
    </div>
  );
};
