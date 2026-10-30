import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ALL_SYSTEM_ZONES, SystemZoneDefinition } from '../../types';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface UserRoleModalProps {
  userToEdit: UserProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({ userToEdit, onClose, onSuccess }) => {
  const { role: currentUserRole, isSuperAdmin, updateUserRoleAndZones } = useAuth();
  const { showToast } = useApp();

  const isAdmin = currentUserRole === 'admin' || isSuperAdmin;

  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [status, setStatus] = useState<'actif' | 'inactif'>('actif');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      const uRole = userToEdit.role || 'client';
      setSelectedRole(uRole);
      setStatus(userToEdit.status === 'inactif' ? 'inactif' : 'actif');

      // If user already has custom allowedModules, use them. Otherwise prefill from role default.
      if (Array.isArray(userToEdit.allowedModules) && userToEdit.allowedModules.length > 0) {
        setSelectedZones(userToEdit.allowedModules);
      } else {
        const defaultZones = ROLE_PERMISSIONS[uRole] || [];
        setSelectedZones(defaultZones);
      }
    }
  }, [userToEdit]);

  if (!userToEdit) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    // Automatically pre-fill the recommended zones for this role
    const defaultZones = ROLE_PERMISSIONS[newRole] || [];
    setSelectedZones(defaultZones);
  };

  const handleToggleZone = (zoneKey: string) => {
    if (!isAdmin) return;
    setSelectedZones((prev) => 
      prev.includes(zoneKey) ? prev.filter((k) => k !== zoneKey) : [...prev, zoneKey]
    );
  };

  const handleApplyDefaults = () => {
    const defaultZones = ROLE_PERMISSIONS[selectedRole] || [];
    setSelectedZones(defaultZones);
  };

  const handleSelectAll = () => {
    setSelectedZones(ALL_SYSTEM_ZONES.map((z) => z.key));
  };

  const handleDeselectAll = () => {
    setSelectedZones(['dashboard']); // Always keep dashboard as minimum
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMessage("Seul l'administrateur peut modifier le rôle d'une personne et lui attribuer l'accès aux zones.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Ensure dashboard is always accessible
      const finalZones = Array.from(new Set([...selectedZones, 'dashboard']));

      await updateUserRoleAndZones(userToEdit.id, selectedRole, finalZones, status);
      showToast(`Rôle et accès aux zones mis à jour pour ${userToEdit.nom || userToEdit.email}`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erreur attribution rôle:', err);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement des droits d'accès.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group zones by category
  const categories: SystemZoneDefinition['category'][] = [
    'Vue Globale',
    'Transport & Flotte',
    'Scolaire',
    'Facturation & Trésorerie',
    'Administration'
  ];

  return (
    <div className="modal-backdrop open" style={{ display: 'flex', zIndex: 9999, overflowY: 'auto', padding: '16px' }}>
      <div className="modal" style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', marginBottom: '4px' }}>
              <span>🛡️ CONTRÔLE D'ACCÈS RBAC (ADMIN SEUL)</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#082b70', fontWeight: 850 }}>
              Gestion du Rôle & Droits d'Accès aux Zones
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
              Collaborateur : <strong>{userToEdit.nom || userToEdit.name || 'Utilisateur'}</strong> ({userToEdit.email})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {!isAdmin && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b', fontSize: '13px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <strong>Action Restreinte :</strong> Seul un administrateur peut modifier le rôle d'un utilisateur et lui attribuer l'accès aux différentes zones du système.
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#c53030', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Section 1: Rôle Principal */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#082b70', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              1. Rôle Principal dans la Société
            </label>
            <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#64748b' }}>
              Le rôle définit le statut légal et le comportement général du compte (tableau de bord, règles de facturation et notifications).
            </p>

            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              disabled={!isAdmin || isSaving}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 700, color: '#0f172a', background: '#ffffff', outline: 'none' }}
            >
              <option value="admin">Administrateur Général (Accès total à tout le système)</option>
              <option value="direction">Direction Générale (Supervision globale et validation)</option>
              <option value="comptabilite">Comptabilité & Trésorerie (Factures, devis, paiements, finances)</option>
              <option value="secretaire">Secrétariat & Accueil (Réservations, clients, devis, plannings)</option>
              <option value="operations">Opérations & Régulation (Flotte, chauffeurs, courses en direct)</option>
              <option value="vendeur">Commercial / Vendeur (Devis proformas, conversion factures, clients)</option>
              <option value="chauffeur">Chauffeur VIP (Missions assignées, véhicule attitré)</option>
              <option value="client">Client VIP Portefeuille (Espace client sécurisé, réservations, devis, factures)</option>
              <option value="prospect">Prospect (Demande de devis et tarifs)</option>
              <option value="lecture_seule">Consultation / Lecture Seule (Aucune modification autorisée)</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Rôle sélectionné : <span className={`user-role-badge ${selectedRole.toUpperCase()}`}>{selectedRole.toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={handleApplyDefaults}
                disabled={!isAdmin || isSaving}
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                title="Rétablir les zones prédéfinies pour ce rôle"
              >
                🔄 Appliquer les zones par défaut de ce rôle
              </button>
            </div>
          </div>

          {/* Section 2: Attribution Granulaire des Zones */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#082b70', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                  2. Accès aux Zones & Modules ({selectedZones.length}/{ALL_SYSTEM_ZONES.length} autorisés)
                </label>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Cochez ou décochez individuellement chaque zone pour accorder un accès précis à cet utilisateur.
                </p>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '11.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '11.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    Tout décocher
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categories.map((cat) => {
                const zonesInCat = ALL_SYSTEM_ZONES.filter((z) => z.category === cat);
                if (zonesInCat.length === 0) return null;

                return (
                  <div key={cat} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                      {cat}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {zonesInCat.map((z) => {
                        const isChecked = selectedZones.includes(z.key);
                        const isDashboard = z.key === 'dashboard'; // Tableau de bord toujours inclus

                        return (
                          <label
                            key={z.key}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: isChecked ? '#eff6ff' : '#ffffff',
                              border: isChecked ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                              cursor: isAdmin ? (isDashboard ? 'default' : 'pointer') : 'not-allowed',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked || isDashboard}
                              disabled={!isAdmin || isDashboard || isSaving}
                              onChange={() => handleToggleZone(z.key)}
                              style={{ marginTop: '2px', accentColor: '#082b70', width: '16px', height: '16px', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px' }}>{z.icon}</span>
                                <strong style={{ fontSize: '13px', color: isChecked ? '#1e3a8a' : '#1e293b' }}>
                                  {z.label}
                                </strong>
                                {z.adminOnly && (
                                  <span style={{ fontSize: '9px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>
                                {z.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Statut du Compte */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Statut du Compte Utilisateur :</strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {status === 'actif' ? 'Compte actif et autorisé à se connecter' : 'Compte suspendu (connexion bloquée)'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => isAdmin && setStatus('actif')}
                disabled={!isAdmin || isSaving}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: status === 'actif' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                  background: status === 'actif' ? '#f0fdf4' : '#ffffff',
                  color: status === 'actif' ? '#15803d' : '#64748b',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: isAdmin ? 'pointer' : 'not-allowed'
                }}
              >
                ✓ Compte Actif
              </button>
              <button
                type="button"
                onClick={() => isAdmin && setStatus('inactif')}
                disabled={!isAdmin || isSaving}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: status === 'inactif' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                  background: status === 'inactif' ? '#fef2f2' : '#ffffff',
                  color: status === 'inactif' ? '#b91c1c' : '#64748b',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: isAdmin ? 'pointer' : 'not-allowed'
                }}
              >
                ✕ Désactivé
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={isSaving}
              style={{ minHeight: '42px', padding: '10px 18px', borderRadius: '10px' }}
            >
              Annuler
            </button>
            {isAdmin && (
              <button
                type="submit"
                className="primary"
                disabled={isSaving}
                style={{ minHeight: '42px', padding: '10px 24px', borderRadius: '10px', fontWeight: 800 }}
              >
                {isSaving ? 'Enregistrement sécurisé...' : '💾 Enregistrer les Modifications'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
