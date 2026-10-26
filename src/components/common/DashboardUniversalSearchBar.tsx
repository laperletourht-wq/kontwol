import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Facture, Proforma, Reservation, Vehicule, Chauffeur, Client, Eleve } from '../../types';

export const DashboardUniversalSearchBar: React.FC = () => {
  const { 
    factures, 
    proformas, 
    reservations, 
    clients, 
    vehicules, 
    chauffeurs, 
    eleves,
    setCurrentModule, 
    setGlobalSearchQuery, 
    setPrintSheetData, 
    showToast,
    settings 
  } = useApp();

  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedFactures: Facture[] = factures.filter((f) => {
      return (
        f.number?.toLowerCase().includes(q) ||
        f.client?.toLowerCase().includes(q) ||
        f.service?.toLowerCase().includes(q) ||
        f.proformaNumber?.toLowerCase().includes(q) ||
        f.status?.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const matchedProformas: Proforma[] = proformas.filter((p) => {
      return (
        p.number?.toLowerCase().includes(q) ||
        p.client?.toLowerCase().includes(q) ||
        p.service?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const matchedReservations: Reservation[] = reservations.filter((r) => {
      return (
        r.id?.toLowerCase().includes(q) ||
        r.client?.toLowerCase().includes(q) ||
        r.service?.toLowerCase().includes(q) ||
        r.origin?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.driver?.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    if (isClient) {
      const total = matchedFactures.length + matchedProformas.length + matchedReservations.length;
      return {
        factures: matchedFactures,
        proformas: matchedProformas,
        reservations: matchedReservations,
        clients: [],
        vehicules: [],
        chauffeurs: [],
        eleves: [],
        total
      };
    }

    const matchedClients: Client[] = clients.filter((c) => {
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telephone?.includes(q) ||
        c.type?.toLowerCase().includes(q)
      );
    }).slice(0, 3);

    const matchedVehicules: Vehicule[] = vehicules.filter((v) => {
      return (
        v.plaque?.toLowerCase().includes(q) ||
        v.marque?.toLowerCase().includes(q) ||
        v.modele?.toLowerCase().includes(q) ||
        v.categorie?.toLowerCase().includes(q) ||
        v.chauffeurAttitre?.toLowerCase().includes(q)
      );
    }).slice(0, 3);

    const matchedChauffeurs: Chauffeur[] = chauffeurs.filter((ch) => {
      return (
        ch.nom?.toLowerCase().includes(q) ||
        ch.telephone?.includes(q) ||
        ch.permisNumero?.toLowerCase().includes(q) ||
        ch.vehiculeActuel?.toLowerCase().includes(q)
      );
    }).slice(0, 3);

    const matchedEleves: Eleve[] = (eleves || []).filter((el) => {
      return (
        el.nom?.toLowerCase().includes(q) ||
        el.prenom?.toLowerCase().includes(q) ||
        el.ecole?.toLowerCase().includes(q) ||
        el.parentNom?.toLowerCase().includes(q) ||
        el.parentTelephone?.includes(q)
      );
    }).slice(0, 3);

    const total = 
      matchedFactures.length + 
      matchedProformas.length + 
      matchedReservations.length + 
      matchedClients.length + 
      matchedVehicules.length + 
      matchedChauffeurs.length + 
      matchedEleves.length;

    return {
      factures: matchedFactures,
      proformas: matchedProformas,
      reservations: matchedReservations,
      clients: matchedClients,
      vehicules: matchedVehicules,
      chauffeurs: matchedChauffeurs,
      eleves: matchedEleves,
      total
    };
  }, [query, factures, proformas, reservations, clients, vehicules, chauffeurs, eleves, isClient]);

  const handleOpenFacture = (f: Facture) => {
    setIsOpen(false);
    setGlobalSearchQuery(f.number);
    setCurrentModule('factures');
    setPrintSheetData({ type: 'facture', data: f });
    showToast(`Facture ${f.number} (${f.client}) ouverte en aperçu PDF direct`, 'success');
  };

  const handleOpenProforma = (p: Proforma) => {
    setIsOpen(false);
    setGlobalSearchQuery(p.number);
    setCurrentModule('proformas');
    setPrintSheetData({ type: 'proforma', data: p });
    showToast(`Devis ${p.number} (${p.client}) ouvert en aperçu PDF direct`, 'success');
  };

  const handleOpenReservation = (r: Reservation) => {
    setIsOpen(false);
    setGlobalSearchQuery(r.id || r.client);
    setCurrentModule('reservations');
    showToast(`Réservation ${r.id} (${r.client}) sélectionnée`, 'info');
  };

  const handleOpenVehicule = (v: Vehicule) => {
    setIsOpen(false);
    setGlobalSearchQuery(v.plaque);
    setCurrentModule('vehicules');
    showToast(`Véhicule ${v.plaque} (${v.marque} ${v.modele})`, 'info');
  };

  const handleOpenChauffeur = (ch: Chauffeur) => {
    setIsOpen(false);
    setGlobalSearchQuery(ch.nom);
    setCurrentModule('chauffeurs');
    showToast(`Fiche Chauffeur : ${ch.nom}`, 'info');
  };

  const handleOpenClient = (c: Client) => {
    setIsOpen(false);
    setGlobalSearchQuery(c.name);
    setCurrentModule('clients');
    showToast(`Fiche Client : ${c.name}`, 'info');
  };

  const handleOpenEleve = (el: Eleve) => {
    setIsOpen(false);
    setGlobalSearchQuery(el.nom);
    setCurrentModule('eleves');
    showToast(`Dossier Élève : ${el.prenom} ${el.nom}`, 'info');
  };

  const handleDirectSearch = () => {
    if (!query.trim()) return;
    const q = query.trim();
    setGlobalSearchQuery(q);
    setIsOpen(false);

    // Smart routing based on query pattern
    if (q.toUpperCase().startsWith('FAC-')) {
      setCurrentModule('factures');
      const found = factures.find((f) => f.number.toUpperCase().includes(q.toUpperCase()));
      if (found) setPrintSheetData({ type: 'facture', data: found });
      showToast(`Recherche facture : ${q}`, 'info');
      return;
    }

    if (q.toUpperCase().startsWith('PRO-') || q.toUpperCase().startsWith('DEV-')) {
      setCurrentModule('proformas');
      const found = proformas.find((p) => p.number.toUpperCase().includes(q.toUpperCase()));
      if (found) setPrintSheetData({ type: 'proforma', data: found });
      showToast(`Recherche devis : ${q}`, 'info');
      return;
    }

    if (q.toUpperCase().startsWith('RES-')) {
      setCurrentModule('reservations');
      showToast(`Recherche réservation : ${q}`, 'info');
      return;
    }

    if (searchResults && searchResults.total > 0) {
      if (searchResults.factures.length > 0) {
        handleOpenFacture(searchResults.factures[0]);
      } else if (searchResults.proformas.length > 0) {
        handleOpenProforma(searchResults.proformas[0]);
      } else if (searchResults.reservations.length > 0) {
        handleOpenReservation(searchResults.reservations[0]);
      } else if (searchResults.vehicules.length > 0) {
        handleOpenVehicule(searchResults.vehicules[0]);
      } else if (searchResults.chauffeurs.length > 0) {
        handleOpenChauffeur(searchResults.chauffeurs[0]);
      } else if (searchResults.clients.length > 0) {
        handleOpenClient(searchResults.clients[0]);
      }
    } else {
      showToast(`Filtre global appliqué : "${q}"`, 'info');
    }
  };

  const handleQuickTag = (tag: string) => {
    setQuery(tag);
    setIsOpen(true);
  };

  return (
    <div className="hero-search-bar-module" ref={containerRef} style={{ marginTop: '18px', position: 'relative', width: '100%', zIndex: 60 }}>
      {/* Search Input Box */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '6px 8px 6px 16px',
          boxShadow: '0 8px 24px rgba(4, 22, 57, 0.18), 0 2px 6px rgba(0,0,0,0.06)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', color: '#082b70', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDirectSearch();
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder={isClient 
            ? "Rechercher parmi vos réservations, devis et factures..." 
            : "Rechercher une réservation, devis (PRO-), facture (FAC-), véhicule, chauffeur, client..."}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: '#0f172a',
            background: 'transparent',
            minWidth: 0,
            padding: '8px 0'
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setGlobalSearchQuery('');
            }}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: '#64748b',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Effacer la saisie"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          onClick={handleDirectSearch}
          style={{
            background: 'linear-gradient(135deg, #082b70 0%, #1675ea 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(8, 43, 112, 0.25)',
            flexShrink: 0
          }}
        >
          <span>Rechercher</span>
          <kbd style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>↵</kbd>
        </button>
      </div>

      {/* Quick Search Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        flexWrap: 'wrap',
        fontSize: '12px'
      }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600, fontSize: '11.5px' }}>
          Accès rapide :
        </span>
        <button
          type="button"
          onClick={() => handleQuickTag('FAC-')}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '3px 10px',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          💳 Factures (FAC-)
        </button>
        <button
          type="button"
          onClick={() => handleQuickTag('PRO-')}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '3px 10px',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          📄 Devis (PRO-)
        </button>
        <button
          type="button"
          onClick={() => handleQuickTag('RES-')}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '3px 10px',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          🚗 Courses (RES-)
        </button>
        {!isClient && (
          <>
            <button
              type="button"
              onClick={() => handleQuickTag('Prado')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '3px 10px',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              🚘 Toyota Prado
            </button>
            <button
              type="button"
              onClick={() => handleQuickTag('En cours')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '3px 10px',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              ⏱️ En cours
            </button>
          </>
        )}
      </div>

      {/* Floating Interactive Results Dropdown */}
      {isOpen && query.trim().length >= 1 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(4, 22, 57, 0.28), 0 0 0 1px rgba(0,0,0,0.08)',
            maxHeight: '440px',
            overflowY: 'auto',
            padding: '14px',
            zIndex: 100,
            color: '#0f172a'
          }}
        >
          {searchResults && searchResults.total > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#082b70', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Résultats instantanés ({searchResults.total} trouvé{searchResults.total > 1 ? 's' : ''})
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Cliquez sur un document pour l'ouvrir directement
                </span>
              </div>

              {/* FACTURES */}
              {searchResults.factures.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>💳 Factures & Règlements ({searchResults.factures.length})</span>
                  </div>
                  {searchResults.factures.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleOpenFacture(f)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                      className="hover:bg-red-50 hover:border-red-200"
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#082b70', fontSize: '13px' }}>{f.number}</strong>
                          <span style={{ fontSize: '12px', color: '#1e293b' }}>• {f.client}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: f.status === 'Payée' ? '#dcfce7' : '#fee2e2', color: f.status === 'Payée' ? '#15803d' : '#b91c1c' }}>
                            {f.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {f.service} • Total : <strong>${(f.totalTTC || f.amount || 0).toLocaleString()} USD</strong> (~{Math.round((f.totalTTC || f.amount || 0) * (settings?.tauxChangeUSD_HTG || 132)).toLocaleString()} HTG)
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        📄 Ouvrir PDF ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* DEVIS PROFORMA */}
              {searchResults.proformas.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📄 Devis Proforma ({searchResults.proformas.length})</span>
                  </div>
                  {searchResults.proformas.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProforma(p)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#082b70', fontSize: '13px' }}>{p.number}</strong>
                          <span style={{ fontSize: '12px', color: '#1e293b' }}>• {p.client}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8' }}>
                            {p.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {p.service} • Total : <strong>${(p.totalTTC || p.amount || 0).toLocaleString()} USD</strong> (~{Math.round((p.totalTTC || p.amount || 0) * (settings?.tauxChangeUSD_HTG || 132)).toLocaleString()} HTG)
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        📄 Ouvrir Devis ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* RÉSERVATIONS */}
              {searchResults.reservations.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🚗 Réservations & Trajets ({searchResults.reservations.length})</span>
                  </div>
                  {searchResults.reservations.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleOpenReservation(r)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                      className="hover:bg-amber-50 hover:border-amber-200"
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#082b70', fontSize: '13px' }}>{r.id}</strong>
                          <span style={{ fontSize: '12px', color: '#1e293b' }}>• {r.client}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#ffedd5', color: '#c2410c' }}>
                            {r.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          📍 {r.origin || 'Port-au-Prince'} ➔ {r.destination || 'Destination'} {r.date ? `• Date : ${r.date}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        Voir Trajet ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* VÉHICULES */}
              {searchResults.vehicules.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    <span>🚘 Flotte Véhicules ({searchResults.vehicules.length})</span>
                  </div>
                  {searchResults.vehicules.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleOpenVehicule(v)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                      className="hover:bg-emerald-50 hover:border-emerald-200"
                    >
                      <div>
                        <strong>{v.marque} {v.modele} ({v.annee})</strong> • Plaque : <span style={{ color: '#082b70', fontWeight: 700 }}>{v.plaque}</span>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Catégorie : {v.categorie} • Chauffeur attitré : {v.chauffeurAttitre || 'Non assigné'}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>Fiche Véhicule ➔</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CHAUFFEURS */}
              {searchResults.chauffeurs.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    <span>👔 Chauffeurs & Personnel ({searchResults.chauffeurs.length})</span>
                  </div>
                  {searchResults.chauffeurs.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => handleOpenChauffeur(ch)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                      className="hover:bg-sky-50 hover:border-sky-200"
                    >
                      <div>
                        <strong>{ch.nom}</strong> {ch.telephone && <span>• 📞 {ch.telephone}</span>}
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Permis : {ch.permisNumero || 'Vérifié'} • Statut : {ch.statut || 'En service'}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>Fiche Chauffeur ➔</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CLIENTS */}
              {searchResults.clients.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    <span>👥 Répertoire Clients ({searchResults.clients.length})</span>
                  </div>
                  {searchResults.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleOpenClient(c)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                      className="hover:bg-purple-50 hover:border-purple-200"
                    >
                      <div>
                        <strong>{c.name}</strong> • {c.email || c.telephone || 'Client Partenaire'}
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Type : {c.type || 'Particulier VIP'} {c.company ? `• Société : ${c.company}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed' }}>Dossier Client ➔</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Aucun résultat pour « {query} »
              </div>
              <p style={{ fontSize: '12.5px', margin: 0, color: '#64748b' }}>
                Vérifiez l'orthographe ou recherchez par référence (FAC-, PRO-, RES-), nom de passager ou immatriculation de véhicule.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
