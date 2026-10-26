import React, { useState, useRef, useEffect } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger' | 'primary' | 'success';
}

interface RowActionMenuProps {
  items: ActionMenuItem[];
  title?: string;
}

export const RowActionMenu: React.FC<RowActionMenuProps> = ({ items, title = 'Actions' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const validItems = items.filter(Boolean);

  if (validItems.length === 0) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="row-action-btn-trigger"
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          background: isOpen ? '#f1f5f9' : '#ffffff',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      {isOpen && (
        <div
          className="row-action-dropdown shadow-xl"
          style={{
            position: 'absolute',
            right: 0,
            top: '38px',
            minWidth: '180px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
            zIndex: 100,
            animation: 'fadeInMenu 0.12s ease-out'
          }}
        >
          {validItems.map((item, idx) => {
            const isDanger = item.variant === 'danger';
            const isPrimary = item.variant === 'primary';
            const isSuccess = item.variant === 'success';

            const color = isDanger 
              ? '#dc2626' 
              : isPrimary 
                ? '#1d4ed8' 
                : isSuccess 
                  ? '#15803d' 
                  : '#1e293b';

            if (item.href) {
              return (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color,
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-slate-50"
                >
                  {item.icon && <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (item.onClick) item.onClick();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color,
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease'
                }}
                className={isDanger ? 'hover:bg-red-50' : 'hover:bg-slate-50'}
              >
                {item.icon && <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
