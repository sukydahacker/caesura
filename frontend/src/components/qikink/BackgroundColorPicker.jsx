import React from 'react';
import { QK } from '@/config/qikinkTheme';

// Caesura dark theme overrides
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const BS = 'rgba(250,250,249,0.08)';
const FONT = '"DM Sans", system-ui, sans-serif';

const BackgroundColorPicker = ({ color, onChange }) => {
  const handleColorInput = (e) => {
    onChange(e.target.value);
  };

  const handleHexInput = (e) => {
    let val = e.target.value;
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    onChange(val);
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <label
        style={{
          fontSize: 14,
          color: TS,
          fontWeight: 500,
          display: 'block',
          marginBottom: 8,
        }}
      >
        Choose Background
      </label>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <input
          type="color"
          value={color || '#ffffff'}
          onChange={handleColorInput}
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            cursor: 'pointer',
            border: `1px solid ${BS}`,
            padding: 0,
            background: 'none',
          }}
        />
        <input
          type="text"
          placeholder="# Color Code"
          value={color || ''}
          onChange={handleHexInput}
          style={{
            width: 120,
            padding: 8,
            border: `1px solid ${BS}`,
            borderRadius: 4,
            fontSize: 13,
            outline: 'none',
            fontFamily: FONT,
            color: TP,
            background: BG3,
          }}
        />
      </div>
    </div>
  );
};

export default BackgroundColorPicker;
