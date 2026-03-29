import React from 'react';
import QK from '@/config/qikinkTheme';

// Caesura dark theme overrides
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const BS = 'rgba(250,250,249,0.08)';
const AS = '#C8FF00';

export default function ColorSelector({
  colors = [],
  selectedColors = [],
  onToggleColor,
}) {
  const allSelected =
    colors.length > 0 && colors.every((c) => selectedColors.includes(c.name));

  const handleSelectAll = () => {
    colors.forEach((color) => {
      if (!selectedColors.includes(color.name)) {
        onToggleColor(color.name);
      }
    });
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
          Product Colors
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
          Select All
        </span>
      </div>

      {/* Color swatches */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.map((color) => {
          const isSelected = selectedColors.includes(color.name);

          return (
            <div
              key={color.name}
              onClick={() => onToggleColor(color.name)}
              title={color.name}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: color.hex,
                cursor: 'pointer',
                border: isSelected
                  ? `1px solid ${AS}`
                  : `1px solid ${BS}`,
                boxShadow: isSelected
                  ? '0 0 8px rgba(200,255,0,0.35)'
                  : 'none',
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
