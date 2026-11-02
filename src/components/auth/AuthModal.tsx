import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authView, setAuthView, showToast, setIsPublicLanding } = useApp();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('Port-au-Prince');
  const [societe, setSociete] = useState('');
  const [numeroFiscal, setNumeroFiscal] = useState('');
  const [expandProfileDetails, setExpandProfileDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!authModalOpen) return null;

  const getAuthErrorMessage = (err: any): string => {
    const code = String(err?.code || '');
    const message = String(err?.message || '');
    if (code.includes('unauthorized-domain') || message.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      return `Le domaine actuel (${currentHost}) n'est pas encore autorisé par Firebase Authentication. Veuillez l'ajouter dans la Console Firebase (Authentication > Paramètres > Domaines autorisés), ou utilisez l'authentification par e-mail et mot de passe ci-dessous.`;
    }
    if (code.includes('popup-closed-by-user') || message.includes('popup-closed-by-user')) {
      return 'La fenêtre de connexion a été fermée avant la fin de l\'authentification.';
    }
    if (code.includes('popup-blocked') || message.includes('popup-blocked')) {
      return 'La fenêtre pop-up a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up pour cette page.';
    }
    if (code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-credential') || message.includes('auth/invalid-credential')) {
      return 'Adresse e-mail ou mot de passe incorrect. Si vous n\'avez pas encore créé de compte, cliquez sur « S\'inscrire » ci-dessous.';
    }
    if (code.includes('email-already-in-use')) {
      return 'Cette adresse e-mail est déjà associée à un compte. Veuillez vous connecter ou utiliser « Mot de passe oublié ».';
    }
    if (code.includes('weak-password')) {
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    }
    return message || 'Une erreur est survenue lors de l\'authentification.';
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      showToast('Connexion réussie avec Google !', 'success');
      setAuthModalOpen(false);
      setIsPublicLanding(false);
    } catch (err: any) {
      console.warn('[Google Auth Notice]:', err?.code || err?.message || err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre e-mail et mot de passe.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithEmail(email, password);
      showToast('Connexion réussie !', 'success');
      setAuthModalOpen(false);
      setIsPublicLanding(false);
    } catch (err: any) {
      console.warn('[Auth Login Notice]:', err?.code || err?.message || err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nom) {
      setErrorMessage('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await registerWithEmail({ 
        email, 
        pass: password, 
        nom, 
        telephone,
        adresse,
        ville,
        societe,
        numeroFiscal
      });
      setAuthView('verify');
      showToast(`Compte créé ! Un e-mail de confirmation officiel vous a été envoyé à ${email}.`, 'success');
    } catch (err: any) {
      console.warn('[Register Notice]:', err?.code || err?.message || err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { auth } = await import('../../lib/firebase');
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          showToast('Adresse e-mail confirmée avec succès !', 'success');
          setAuthModalOpen(false);
          setIsPublicLanding(false);
          return;
        }
      }
      showToast("L'e-mail n'est pas encore confirmé. Veuillez cliquer sur le lien reçu par e-mail, puis réessayez.", 'info');
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la vérification de l'e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await resendVerificationEmail();
      showToast(`Un nouvel e-mail de confirmation officiel a été envoyé à ${email}.`, 'success');
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de l'envoi de l'e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Veuillez saisir votre adresse e-mail.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossible d\'envoyer l\'e-mail de réinitialisation.');
      }
      showToast(data.message || `Un lien de réinitialisation sécurisé a été transmis à ${email}`, 'success');
      setAuthView('login');
    } catch (err: any) {
      console.warn('[Password Reset Notice]:', err?.message);
      setErrorMessage(err?.message || 'Erreur lors de la demande de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex' }}>
      <div className="auth-card-split" style={{ position: 'relative' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#475569',
            zIndex: 10
          }}
          title="Fermer"
        >
          ✕
        </button>

        {/* Brand Side */}
        <div className="auth-brand-side">
          <div className="auth-decor-bg">
            <div className="decor-orb decor-orb-1" />
            <div className="decor-orb decor-orb-2" />
            <div className="decor-pill decor-pill-orange-1" />
            <div className="decor-pill decor-pill-orange-2" />
            <div className="decor-pill decor-pill-gold-1" />
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#fff', padding: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>LAPERLE TOUR HT</h3>
                <span style={{ fontSize: '12px', color: '#ffd285', fontStyle: 'italic' }}>« Un coup d'œil sur Haïti »</span>
              </div>
            </div>

            <div style={{ margin: '30px 0 20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#f7941d', fontWeight: 800, marginBottom: '6px' }}>
                CENTRE DE CONTRÔLE OPÉRATIONNEL
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.25, margin: 0 }}>
                Votre Espace Sécurisé de Réservation & Flotte
              </h2>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '13px', lineHeight: 2, color: '#e2e8f0' }}>
              <li>✓ Suivi des réservations et devis proformas en direct</li>
              <li>✓ Gestion des circuits touristiques et locations VIP SUV</li>
              <li>✓ Dispatching chauffeurs, plannings et navettes scolaires</li>
              <li>✓ Factures certifiées conformes aux normes DGI</li>
            </ul>
          </div>

          <div style={{ position: 'relative', zIndex: 2, fontSize: '11px', opacity: 0.8 }}>
            Assistance permanente 24h/24 : +509 4440 8687
          </div>
        </div>

        {/* Form Side */}
        <div className="auth-form-side" style={{ flex: 1.2, padding: '36px 32px', overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', marginBottom: '16px' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* VIEW: LOGIN */}
          {authView === 'login' && (
            <div>
              <div className="auth-form-top">
                <div className="auth-login-kicker">ESPACE MEMBRES & ÉQUIPES</div>
                <h2 className="auth-login-heading" style={{ margin: '4px 0 6px', color: '#082b70', fontSize: '22px' }}>Connexion</h2>
                <p className="auth-login-sub" style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Accédez à votre tableau de bord LAPERLE TOUR HT</p>
              </div>

              <form onSubmit={handleEmailLogin} style={{ marginTop: '20px' }}>
                <div className="auth-field" style={{ marginBottom: '14px' }}>
                  <label htmlFor="authLoginEmail" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Adresse e-mail :
                  </label>
                  <input
                    id="authLoginEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@domaine.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                <div className="auth-field" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label htmlFor="authLoginPass" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Mot de passe :</label>
                    <button type="button" onClick={() => setAuthView('forgot')} style={{ background: 'none', border: 'none', color: '#1675ea', fontSize: '11px', cursor: 'pointer' }}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="authLoginPass"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#082b70', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>

              <div className="auth-sep-wrap" style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
                <span className="auth-sep-line" style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span className="auth-sep-text" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>OU</span>
                <span className="auth-sep-line" style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <button
                type="button"
                className="google-signin-btn"
                onClick={handleGoogleAuth}
                disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuer avec Google</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('register')}
                  style={{ background: 'none', border: 'none', color: '#082b70', fontWeight: 700, cursor: 'pointer' }}
                >
                  S'inscrire
                </button>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {authView === 'register' && (
            <div>
              <div className="auth-form-top">
                <div className="auth-login-kicker">NOUVEAU COMPTE</div>
                <h2 className="auth-login-heading" style={{ margin: '4px 0 6px', color: '#082b70', fontSize: '22px' }}>Inscription</h2>
                <p className="auth-login-sub" style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Créez votre compte en 1 minute</p>
              </div>

              <form onSubmit={handleRegister} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="authRegNom" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Nom complet :</label>
                  <input
                    id="authRegNom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Jean-Marc Delacroix"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="authRegEmail" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Adresse e-mail :</label>
                  <input
                    id="authRegEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@domaine.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="authRegTel" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Téléphone (avec indicatif) :</label>
                  <input
                    id="authRegTel"
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+509 4440 8687"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="authRegPass" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Mot de passe :</label>
                  <input
                    id="authRegPass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                {/* Section optionnelle pour compléter le profil dès l'inscription */}
                <div style={{ marginBottom: '18px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📝</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: '#082b70' }}>
                          Compléter mon profil dès maintenant
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Adresse, Ville, Entreprise, NIF (ou plus tard)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandProfileDetails(!expandProfileDetails)}
                      style={{
                        background: expandProfileDetails ? '#082b70' : '#e2e8f0',
                        color: expandProfileDetails ? '#fff' : '#1e293b',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {expandProfileDetails ? 'Masquer' : 'Remplir +'}
                    </button>
                  </div>

                  {expandProfileDetails && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      {/* Adresse & Ville */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                            Adresse de résidence / livraison :
                          </label>
                          <input
                            type="text"
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            placeholder="Ex : 24, Rue Rebecca, Delmas 75"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                            Ville :
                          </label>
                          <select
                            value={ville}
                            onChange={(e) => setVille(e.target.value)}
                            style={{ width: '100%', padding: '8px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                          >
                            <option value="Port-au-Prince">Port-au-Prince</option>
                            <option value="Pétion-Ville">Pétion-Ville</option>
                            <option value="Delmas">Delmas</option>
                            <option value="Tabarre">Tabarre</option>
                            <option value="Carrefour">Carrefour</option>
                            <option value="Cap-Haïtien">Cap-Haïtien</option>
                            <option value="Jacmel">Jacmel</option>
                            <option value="Saint-Marc">Saint-Marc</option>
                            <option value="Gonaïves">Gonaïves</option>
                            <option value="Les Cayes">Les Cayes</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>

                      {/* Société / Entreprise */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', margin: 0 }}>
                            Société / Entreprise :
                          </label>
                          <button
                            type="button"
                            onClick={() => setSociete('Particulier')}
                            style={{
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Cliquer si « Particulier »
                          </button>
                        </div>
                        <input
                          type="text"
                          value={societe}
                          onChange={(e) => setSociete(e.target.value)}
                          placeholder="Ex : Particulier ou Ambassade / Entreprise"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>

                      {/* Numéro fiscal NIF/CIF */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                          Numéro fiscal (NIF / CIF / Matricule) :
                        </label>
                        <input
                          type="text"
                          value={numeroFiscal}
                          onChange={(e) => setNumeroFiscal(e.target.value)}
                          placeholder="Ex : 001-234-567-8"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                          Requis par la DGI pour l'émission des factures officielles.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f7941d', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  {loading ? 'Validation en cours...' : 'Continuer ➔'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  style={{ background: 'none', border: 'none', color: '#082b70', fontWeight: 700, cursor: 'pointer' }}
                >
                  Se connecter
                </button>
              </div>
            </div>
          )}

          {/* VIEW: VERIFY EMAIL */}
          {authView === 'verify' && (
            <div>
              <div className="auth-form-top">
                <div className="auth-login-kicker">CONFIRMATION FIREBASE AUTHENTICATION</div>
                <h2 className="auth-login-heading" style={{ margin: '4px 0 6px', color: '#082b70', fontSize: '22px' }}>Vérification de l'e-mail</h2>
                <p className="auth-login-sub" style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Un e-mail officiel de confirmation vous a été envoyé par Firebase.
                </p>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', margin: '18px 0', fontSize: '13px', color: '#1e3a8a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✉️</span>
                  <strong>{email}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                  Veuillez ouvrir votre boîte de réception (et vos spams si nécessaire) et cliquer sur le lien officiel de confirmation pour certifier votre adresse.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCheckEmailVerified}
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#082b70', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  {loading ? 'Vérification en cours...' : '✓ J\'ai confirmé mon e-mail'}
                </button>

                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={loading}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#f8fafc', color: '#082b70', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  🔄 Renvoyer l'e-mail de confirmation
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setIsPublicLanding(false);
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  Continuer et confirmer plus tard
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('register')}
                  style={{ background: 'none', border: 'none', color: '#082b70', fontWeight: 700, cursor: 'pointer' }}
                >
                  Modifier mes infos
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {authView === 'forgot' && (
            <div>
              <div className="auth-form-top">
                <div className="auth-login-kicker">RÉCUPÉRATION</div>
                <h2 className="auth-login-heading" style={{ margin: '4px 0 6px', color: '#082b70', fontSize: '22px' }}>Mot de passe oublié</h2>
                <p className="auth-login-sub" style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Recevez un lien de réinitialisation sécurisé</p>
              </div>

              <form onSubmit={handleForgotPassword} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="authForgotIdentifier" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Adresse e-mail :
                  </label>
                  <input
                    id="authForgotIdentifier"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#082b70', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  Envoyer le lien de réinitialisation
                </button>
              </form>

              <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <strong>Besoin d'assistance directe ?</strong>
                <p style={{ margin: '4px 0 8px', color: '#64748b' }}>Notre équipe d'administration est disponible sur WhatsApp :</p>
                <a href="https://wa.me/50944408687" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
                  💬 Assistance WhatsApp (+509 4440 8687)
                </a>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  style={{ background: 'none', border: 'none', color: '#082b70', fontWeight: 700, cursor: 'pointer' }}
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
