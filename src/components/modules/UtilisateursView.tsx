import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import { UserProfile, ALL_SYSTEM_ZONES } from '../../types';
import { UserRoleModal } from '../modals/UserRoleModal';
import { RowActionMenu, ActionMenuItem } from '../common/RowActionMenu';

interface UtilisateursViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const UtilisateursView: React.FC<UtilisateursViewProps> = ({ onOpenModal }) => {
  const { utilisateurs, showToast, globalSearchQuery } = useApp();
  const { role: currentUserRole, isSuperAdmin } = useAuth();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const isAdmin = currentUserRole === 'admin' || isSuperAdmin;

  // Fallback demo list if Firestore utilisateurs list is empty
  const displayUsers: UserProfile[] = utilisateurs.length > 0 ? utilisateurs : [
    {
      id: 'usr-admin-1',
      email: 'castimamoise@gmail.com',
      nom: 'Castima Moïse (Super Administrateur)',
      role: 'admin',
      roles: ['admin'],
      allowedModules: ALL_SYSTEM_ZONES.map(z => z.key),
      status: 'actif'
    },
    {
      id: 'usr-admin-2',
      email: 'laperletourht@gmail.com',
      nom: 'Direction Générale Laperle',
      role: 'admin',
      roles: ['admin'],
      allowedModules: ALL_SYSTEM_ZONES.map(z => z.key),
      status: 'actif'
    },
    {
      id: 'usr-compta-1',
      email: 'comptabilite@laperletour.ht',
      nom: 'Service Comptabilité & Trésorerie',
      role: 'comptabilite',
      roles: ['comptabilite'],
      allowedModules: ['dashboard', 'proformas', 'factures', 'clients', 'abonnements', 'paiements', 'finances'],
      status: 'actif'
    },
    {
      id: 'usr-dispatch-1',
      email: 'secretaire@laperletour.ht',
      nom: 'Bureau Dispatch & Accueil',
      role: 'secretaire',
      roles: ['secretaire'],
      allowedModules: ['dashboard', 'reservations', 'proformas', 'factures', 'clients', 'eleves', 'abonnements', 'plannings'],
      status: 'actif'
    }
  ];

  const effectiveSearch = globalSearchQuery.toLowerCase();

  const filtered = displayUsers.filter((u) => {
    if (roleFilter !== 'ALL' && (u.role || 'client') !== roleFilter) return false;
    if (effectiveSearch) {
      const matchEmail = (u.email || '').toLowerCase().includes(effectiveSearch);
      const matchNom = (u.nom || u.name || '').toLowerCase().includes(effectiveSearch);
      const matchRole = (u.role || '').toLowerCase().includes(effectiveSearch);
      return matchEmail || matchNom || matchRole;
    }
    return true;
  });

  const getAuthorizedZones = (u: UserProfile) => {
    if (Array.isArray(u.allowedModules) && u.allowedModules.length > 0) {
      return u.allowedModules;
    }
    const r = u.role || 'client';
    return ROLE_PERMISSIONS[r] || ['dashboard'];
  };

  return (
    <div>
      {/* Superviseur Admin Banner */}
      <div style={{
        background: isAdmin 
          ? 'linear-gradient(135deg, #07255e 0%, #0d3b87 100%)' 
          : '#f8fafc',
        color: isAdmin ? '#ffffff' : '#1e293b',
        border: isAdmin ? '1px solid #1e40af' : '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: isAdmin ? '0 8px 24px rgba(7, 37, 94, 0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: isAdmin ? '#fbbf24' : '#64748b', marginBottom: '6px' }}>
            <span>{isAdmin ? '🛡️ CONTRÔLE D\'ACCÈS CENTRALISÉ (RBAC)' : '🔒 ACCÈS RESTREINT AUX RÔLES'}</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 850, color: isAdmin ? '#ffffff' : '#082b70' }}>
            Gestion des Utilisateurs & Attribution des Rôles et Zones
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: isAdmin ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>
            {isAdmin 
              ? "En tant qu'administrateur, vous seul avez le pouvoir exclusif de modifier le rôle d'une personne, d'activer/désactiver son compte et de lui donner accès aux zones spécifiques du système."
              : "Seul l'administrateur peut modifier le rôle d'une personne et lui attribuer l'accès aux différentes zones du système. Cette vue est en mode consultation."}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button" 
              className="primary" 
              onClick={() => onOpenModal('utilisateur')}
              style={{ background: '#f59e0b', color: '#041639', border: 'none', fontWeight: 800, padding: '12px 20px', borderRadius: '10px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}
            >
              + Nouvel Utilisateur
            </button>
          </div>
        )}
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '12px', marginBottom: '18px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Filtrer par rôle :</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="ALL">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="comptabilite">Comptabilité & Finances</option>
              <option value="secretaire">Secrétariat & Accueil</option>
              <option value="operations">Opérations & Flotte</option>
              <option value="vendeur">Commercial / Vendeur</option>
              <option value="chauffeur">Chauffeur Privé</option>
              <option value="client">Client & Passager</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} répertorié{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Utilisateur</th>
                  <th>Adresse E-mail</th>
                  <th style={{ width: '130px' }}>Rôle</th>
                  <th>Zones d'Accès Autorisées</th>
                  <th style={{ width: '100px' }}>Statut</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action Admin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const zones = getAuthorizedZones(u);
                  const isUserAdminRole = u.role === 'admin';
                  const cleanPhone = (u.telephone || '').replace(/\D/g, '');

                  const actionItems: ActionMenuItem[] = [
                    ...(isAdmin ? [
                      {
                        label: 'Gérer Rôle & Zones',
                        icon: '🔑',
                        onClick: () => setEditingUser(u),
                        variant: 'primary' as const
                      }
                    ] : []),
                    ...(cleanPhone ? [
                      {
                        label: 'WhatsApp',
                        icon: '💬',
                        href: `https://wa.me/${cleanPhone}`,
                        variant: 'success' as const
                      }
                    ] : [])
                  ];

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isUserAdminRole ? '#082b70' : '#eff6ff',
                            color: isUserAdminRole ? '#fbbf24' : '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                            flexShrink: 0,
                            border: isUserAdminRole ? '2px solid #f59e0b' : '1px solid #bfdbfe'
                          }}>
                            {(u.nom || u.name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '13.5px', display: 'block' }}>
                              {u.nom || u.name || 'Utilisateur'}
                            </strong>
                            {u.telephone && <span style={{ fontSize: '11px', color: '#64748b' }}>{u.telephone}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                        {u.email}
                      </td>
                      <td>
                        <span className={`user-role-badge ${(u.role || 'client').toUpperCase()}`}>
                          {(u.role || 'client').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '420px' }}>
                          {isUserAdminRole ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                              ⭐ Toutes les zones (Accès Super Administrateur)
                            </span>
                          ) : zones.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Aucune zone</span>
                          ) : (
                            zones.map((zKey) => {
                              const zoneDef = ALL_SYSTEM_ZONES.find((item) => item.key === zKey);
                              return (
                                <span
                                  key={zKey}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: '#f1f5f9',
                                    color: '#1e293b',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title={zoneDef?.description}
                                >
                                  <span>{zoneDef?.icon || '•'}</span>
                                  <span>{zoneDef?.label || zKey}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`user-status-badge ${u.status || 'actif'}`}>
                          {u.status === 'inactif' ? 'Désactivé' : 'Actif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        {actionItems.length > 0 ? (
                          <RowActionMenu items={actionItems} title={`Gérer ${u.nom || u.email}`} />
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>🔒 Lecture</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Affichage de <strong>{filtered.length}</strong> compte(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition des rôles et des zones pour l'admin */}
      {editingUser && (
        <UserRoleModal
          userToEdit={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            showToast('Autorisations mises à jour avec succès.', 'success');
          }}
        />
      )}
    </div>
  );
};
