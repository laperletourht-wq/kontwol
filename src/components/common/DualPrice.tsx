import React from 'react';
import { useApp } from '../../context/AppContext';

interface DualPriceProps {
  amount?: number;
  amountUSD?: number;
  usdAmount?: number;
  currency?: 'USD' | 'HTG' | string;
  className?: string;
  showDual?: boolean;
  inline?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const DualPrice: React.FC<DualPriceProps> = ({
  amount,
  amountUSD,
  usdAmount,
  currency = 'USD',
  className = '',
  showDual = true,
  inline = false,
  size = 'md',
}) => {
  const actualAmount = amount !== undefined ? amount : (amountUSD !== undefined ? amountUSD : (usdAmount !== undefined ? usdAmount : 0));
  const { settings } = useApp();
  const rate = settings?.tauxChangeUSD_HTG || 132.0;

  const isUSD = currency?.toUpperCase() === 'USD' || !currency;
  const numAmount = Number(actualAmount) || 0;

  let primaryText = '';
  let secondaryText = '';

  if (isUSD) {
    primaryText = `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD`;
    const convertedHTG = Math.round(numAmount * rate);
    secondaryText = `${convertedHTG.toLocaleString('fr-FR')} HTG`;
  } else {
    primaryText = `${numAmount.toLocaleString('fr-FR')} HTG`;
    const convertedUSD = rate > 0 ? (numAmount / rate).toFixed(2) : '0.00';
    secondaryText = `$${Number(convertedUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
  }

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-bold'
  };

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1.5 font-medium ${sizeClasses[size]} ${className}`}>
      <span className="font-semibold text-slate-900 tracking-tight">
        {primaryText}
      </span>
      {showDual && (
        <span className="text-[11px] font-medium text-amber-700/90 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 whitespace-nowrap">
          ≈ {secondaryText}
        </span>
      )}
    </span>
  );
};
