import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole } from '../../types';

interface UtilisateursViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const UtilisateursView: React.FC<UtilisateursViewProps> = ({ onOpenModal }) => {
  const { utilisateurs, showToast } = useApp();
  const { user: currentFirebaseUser, profile: currentProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample seed fallback if Firestore utilisateurs list is empty
  const displayUsers: UserProfile[] = utilisateurs.length > 0 ? utilisateurs : [
    {
      id: 'usr-admin-1',
      email: 'castimamoise@gmail.com',
      nom: 'Castima Moïse (Super Administrateur)',
      role: 'admin',
      roles: ['admin'],
      status: 'actif'
    },
    {
      id: 'usr-admin-2',
      email: 'laperletourht@gmail.com',
      nom: 'Direction Générale Laperle',
      role: 'admin',
      roles: ['admin'],
      status: 'actif'
    },
    {
      id: 'usr-compta-1',
      email: 'comptabilite@laperletour.ht',
      nom: 'Service Comptabilité & Trésorerie',
      role: 'comptabilite',
      roles: ['comptabilite'],
      status: 'actif'
    },
    {
      id: 'usr-dispatch-1',
      email: 'secretaire@laperletour.ht',
      nom: 'Bureau Dispatch & Accueil',
      role: 'secretaire',
      roles: ['secretaire'],
      status: 'actif'
    }
  ];

  const filtered = displayUsers.filter((u) => {
    if (searchTerm) {
      const matchEmail = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNom = (u.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchEmail || matchNom;
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Gestion des Utilisateurs & Droits d'Accès (RBAC)</h2>
          <p>Administration des comptes, attribution des privilèges et contrôle des accès du personnel.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('utilisateur')}>
            + Créer un Utilisateur
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par nom ou adresse e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Adresse E-mail</th>
                <th>Rôle Actuel</th>
                <th>Statut du Compte</th>
                <th>Dernière Connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.nom || u.name || 'Utilisateur'}</strong>
                    {u.telephone && <div style={{ fontSize: '11px', color: '#64748b' }}>{u.telephone}</div>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`user-role-badge ${(u.role || 'client').toUpperCase()}`}>
                      {(u.role || 'client').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`user-status-badge ${u.status || 'actif'}`}>
                      {u.status === 'inactif' ? 'Désactivé' : 'Actif'}
                    </span>
                  </td>
                  <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : 'Récemment'}</td>
                  <td>
                    <div className="action-cell">
                      <button
                        type="button"
                        className="tiny edit"
                        onClick={() => onOpenModal('utilisateur', u)}
                        title="Modifier rôle et statut"
                      >
                        ✏️ Gérer accès
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
