import React from 'react';
import { QK } from '@/config/qikinkTheme';

// Caesura dark theme overrides
const BG = '#0A0A0B';
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const TT = 'rgba(250,250,249,0.25)';
const BS = 'rgba(250,250,249,0.08)';
const FONT = '"DM Sans", system-ui, sans-serif';

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
};

const labelStyle = {
  fontSize: 13,
  color: TS,
  fontFamily: FONT,
};

const inputStyle = {
  border: 'none',
  borderBottom: `1px solid ${BS}`,
  textAlign: 'right',
  fontSize: 14,
  fontFamily: FONT,
  color: TP,
  background: BG3,
  outline: 'none',
  padding: '4px 0',
  width: 60,
};

const unitStyle = {
  fontSize: 12,
  color: TT,
  marginLeft: 4,
  fontFamily: FONT,
};

export default function ImageDimensionsPanel({
  widthInches,
  heightInches,
  dpi,
  quality = 'Good',
  angle = 0,
  onWidthChange,
  onHeightChange,
  onAngleChange,
}) {
  return (
    <div style={{ fontFamily: FONT, padding: '12px 0' }}>
      {/* Width */}
      <div style={rowStyle}>
        <span style={labelStyle}>Width</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            value={widthInches}
            onChange={(e) => onWidthChange(parseFloat(e.target.value) || 0)}
            style={inputStyle}
            step="0.1"
            min="0"
          />
          <span style={unitStyle}>In</span>
        </div>
      </div>

      {/* Height */}
      <div style={rowStyle}>
        <span style={labelStyle}>Height</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            value={heightInches}
            onChange={(e) => onHeightChange(parseFloat(e.target.value) || 0)}
            style={inputStyle}
            step="0.1"
            min="0"
          />
          <span style={unitStyle}>In</span>
        </div>
      </div>

      {/* Image DPI */}
      <div style={rowStyle}>
        <span style={labelStyle}>Image DPI</span>
        <input
          type="text"
          value={dpi}
          readOnly
          style={{ ...inputStyle, color: TT, cursor: 'default' }}
        />
      </div>

      {/* Design File Quality */}
      <div style={rowStyle}>
        <span style={labelStyle}>Design File quality</span>
        <input
          type="text"
          value={quality}
          readOnly
          style={{ ...inputStyle, color: TT, cursor: 'default' }}
        />
      </div>

      {/* Design Angle */}
      <div style={rowStyle}>
        <span style={labelStyle}>Design Angle</span>
        <input
          type="number"
          value={angle}
          onChange={(e) => onAngleChange(parseFloat(e.target.value) || 0)}
          style={inputStyle}
          step="1"
        />
      </div>
    </div>
  );
}
