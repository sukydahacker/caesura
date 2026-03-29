import React from 'react';
import { PRINTING_OPTIONS, VINYL_SUB_OPTIONS } from '@/config/qikinkTheme';

const FONT = '"DM Sans", system-ui, sans-serif';

// Caesura dark theme tokens
const BG = '#0A0A0B';
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const BS = 'rgba(250,250,249,0.08)';
const AS = '#C8FF00';

export default function PrintingOptions({ value, onChange, vinylSubOption, onVinylSubChange }) {
  return (
    <div style={{ padding: '16px 0', fontFamily: FONT }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: TP,
          marginBottom: 12,
        }}
      >
        Printing Options
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PRINTING_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 14,
              color: TP,
              fontFamily: FONT,
            }}
          >
            <input
              type="radio"
              name="printing-option"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              style={{ accentColor: AS, margin: 0, cursor: 'pointer' }}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {value === 'vinyl' && (
        <div style={{ marginTop: 10, paddingLeft: 24 }}>
          <select
            value={vinylSubOption ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onVinylSubChange(val === '' ? null : Number(val));
            }}
            style={{
              width: '100%',
              border: `1px solid ${BS}`,
              borderRadius: 4,
              padding: 8,
              fontSize: 13,
              fontFamily: FONT,
              color: TP,
              backgroundColor: BG3,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Select vinyl type</option>
            {VINYL_SUB_OPTIONS.map((sub) => (
              <option key={sub.value} value={sub.value}>
                {sub.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
