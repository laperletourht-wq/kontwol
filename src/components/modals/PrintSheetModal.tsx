import React from 'react';
import { useApp } from '../../context/AppContext';

export const PrintSheetModal: React.FC = () => {
  const { printSheetData, setPrintSheetData, settings } = useApp();

  if (!printSheetData) return null;

  const { type, data } = printSheetData;
  const isFacture = type === 'facture';
  const title = isFacture ? 'FACTURE OFFICIELLE' : 'DEVIS PROFORMA';
  const number = data.number || data.id;
  const client = data.client || 'Client Laperle';
  const date = data.date || new Date().toISOString().slice(0, 10);
  const dueDate = data.dueDate || '-';
  const items = data.items || [
    {
      description: data.service || 'Prestation de transport privé avec chauffeur assermenté',
      quantity: 1,
      unitPrice: data.amount || 0,
      total: data.amount || 0
    }
  ];

  const subTotal = items.reduce((sum: number, it: any) => sum + (it.total || 0), 0) || data.amount || 0;
  const tva = data.tva || Math.round(subTotal * 0.1);
  const totalTTC = data.totalTTC || (subTotal + tva);
  const equivalentHTG = Math.round(totalTTC * (settings.tauxChangeUSD_HTG || 132));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop open" style={{ display: 'flex', zIndex: 9999 }}>
      <div 
        className="modal" 
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: '#fff',
          borderRadius: '12px',
          padding: '30px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="primary" onClick={handlePrint}>
              🖨️ Imprimer la Facture / Devis
            </button>
          </div>
          <button type="button" className="close" onClick={() => setPrintSheetData(null)}>
            ✕
          </button>
        </div>

        {/* Printable Official Document */}
        <div id="printDocumentArea" style={{ background: '#fff', color: '#172033', padding: '10px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #082b70', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img src="/logo-laperle.jpg" alt="Logo Laperle" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#082b70' }}>LAPERLE TOUR HT</h1>
                <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#f7941d', fontWeight: 600 }}>« Un coup d'œil sur Haïti »</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Transport • Tourisme • Flotte VIP • Scolaire • Courses</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
              <div><strong>Siège Social :</strong> {settings.adresse}</div>
              <div><strong>Téléphones :</strong> {settings.telephone1} / {settings.telephone2}</div>
              <div><strong>WhatsApp :</strong> {settings.whatsapp}</div>
              <div><strong>E-mail :</strong> {settings.email}</div>
              <div><strong>NIF :</strong> {settings.numeroFiscal}</div>
            </div>
          </div>

          {/* Doc Title & Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0 16px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f7941d', textTransform: 'uppercase' }}>DOCUMENT OFFICIEL</div>
              <h2 style={{ margin: '4px 0', fontSize: '20px', color: '#082b70' }}>{title} N° {number}</h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Date d'émission : <strong>{date}</strong></div>
              {isFacture && <div style={{ fontSize: '12px', color: '#64748b' }}>Date d'échéance : <strong>{dueDate}</strong></div>}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DESTINATAIRE / CLIENT</div>
              <h3 style={{ margin: '4px 0', fontSize: '16px', color: '#0f172a' }}>{client}</h3>
              {data.telephone && <div style={{ fontSize: '12px', color: '#64748b' }}>Tél : {data.telephone}</div>}
              {data.email && <div style={{ fontSize: '12px', color: '#64748b' }}>Email : {data.email}</div>}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#082b70', color: '#fff' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Désignation de la prestation</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>Qté</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Prix Unitaire</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Total ($ USD)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>
                    <strong>{it.description}</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>${(it.unitPrice || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}><strong>${(it.total || 0).toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px' }}>
            <div style={{ width: '55%', fontSize: '11px', color: '#64748b', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <strong>MODALITÉS DE RÈGLEMENT OFFICIELLES :</strong><br />
              • Virement Bancaire : UNIBANK / SOGEBANK au nom de <strong>LAPERLE TOUR HT</strong><br />
              • MonCash / Natcash Direct : <strong>+509 4440 8687</strong><br />
              • Espèces acceptées au bureau central de Delmas contre reçu certifié.<br />
              <em>Taux de conversion officiel retenu : 1 USD = {settings.tauxChangeUSD_HTG} HTG</em>
            </div>

            <div style={{ width: '38%', textAlign: 'right', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span>Sous-total HT :</span>
                <strong>${subTotal.toLocaleString()} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span>Taxe / TVA ({settings.tvaPourcentage}%) :</span>
                <strong>${tva.toLocaleString()} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '16px', color: '#082b70' }}>
                <span>TOTAL À PAYER :</span>
                <strong>${totalTTC.toLocaleString()} USD</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Soit environ : <strong>{equivalentHTG.toLocaleString()} HTG</strong>
              </div>
            </div>
          </div>

          {/* Stamp & Signature Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Document généré par le Centre de Contrôle Laperle • Logiciel officiel LAPERLE TOUR HT
            </div>

            <div style={{ textAlign: 'center', border: '1.5px dashed #082b70', padding: '12px 24px', borderRadius: '8px', color: '#082b70' }}>
              <div style={{ fontSize: '11px', fontWeight: 800 }}>LAPERLE TOUR HT</div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direction Administrative & Financière</div>
              <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>✓ CERTIFIÉ CONFORME</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
