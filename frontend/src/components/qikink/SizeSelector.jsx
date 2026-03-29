import React, { useState } from 'react';
import QK from '@/config/qikinkTheme';

// Caesura dark theme overrides
const BG = '#0A0A0B';
const BG2 = '#111113';
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const TT = 'rgba(250,250,249,0.25)';
const BS = 'rgba(250,250,249,0.08)';
const AS = '#C8FF00';

export default function SizeSelector({
  sizes = ['S', 'M', 'L', 'XL', 'XXL'],
  selectedSizes = [],
  onToggleSize,
  sizePrices = {},
  onSizePriceChange,
  basePrices = {},
  onApplyToAll,
}) {
  const [applyAllPrice, setApplyAllPrice] = useState('');

  const allSelected = sizes.length > 0 && sizes.every((s) => selectedSizes.includes(s));

  const handleSelectAll = () => {
    sizes.forEach((size) => {
      if (!selectedSizes.includes(size)) {
        onToggleSize(size);
      }
    });
  };

  const handleApplyToAll = () => {
    const price = parseFloat(applyAllPrice);
    if (!isNaN(price) && onApplyToAll) {
      onApplyToAll(price);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: TP,
          }}
        >
          Available Sizes
        </span>
        <span
          onClick={handleSelectAll}
          style={{
            fontSize: 13,
            color: TS,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Select all
        </span>
      </div>

      {/* Apply to All row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button
          onClick={handleApplyToAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            color: TS,
            background: BG3,
            border: `1px solid ${BS}`,
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Apply to All
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${BS}`,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              padding: '6px 6px 6px 10px',
              fontSize: 13,
              color: TS,
              background: BG2,
              borderRight: `1px solid ${BS}`,
              lineHeight: '20px',
            }}
          >
            ₹
          </span>
          <input
            type="number"
            value={applyAllPrice}
            onChange={(e) => setApplyAllPrice(e.target.value)}
            placeholder="Price"
            style={{
              width: 80,
              padding: '6px 8px',
              fontSize: 13,
              border: 'none',
              outline: 'none',
              background: BG3,
              color: TP,
            }}
          />
        </div>
      </div>

      {/* Size buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {sizes.map((size) => {
          const isSelected = selectedSizes.includes(size);
          const basePrice = basePrices[size];
          const salePrice = sizePrices[size] ?? '';

          return (
            <div
              key={size}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 70,
                minHeight: 40,
                padding: '8px 6px',
                border: `1px solid ${isSelected ? AS : BS}`,
                borderRadius: 4,
                background: isSelected ? 'rgba(200,255,0,0.06)' : BG3,
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => onToggleSize(size)}
            >
              {/* Size letter */}
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: TP,
                  marginBottom: 2,
                }}
              >
                {size}
              </span>

              {/* Base price */}
              {basePrice !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    color: TS,
                    marginBottom: 4,
                  }}
                >
                  ₹{Number(basePrice).toFixed(2)}
                </span>
              )}

              {/* Custom price input */}
              <input
                type="number"
                value={salePrice}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onSizePriceChange(size, e.target.value);
                }}
                placeholder="₹"
                style={{
                  fontSize: 12,
                  width: 60,
                  textAlign: 'center',
                  border: `1px solid ${BS}`,
                  borderRadius: 3,
                  padding: '3px 2px',
                  outline: 'none',
                  background: BG2,
                  color: TP,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
