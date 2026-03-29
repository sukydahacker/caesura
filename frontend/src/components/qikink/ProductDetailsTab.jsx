import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { QK } from '@/config/qikinkTheme';

// Caesura dark theme overrides
const BG = '#0A0A0B';
const BG2 = '#111113';
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const TT = 'rgba(250,250,249,0.25)';
const BS = 'rgba(250,250,249,0.08)';
const FONT = '"DM Sans", system-ui, sans-serif';

const TOOLBAR_OPTIONS = [
  ['bold', 'italic'],
  [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ header: [1, 2, 3, false] }],
];

const ProductDetailsTab = ({
  productName,
  onNameChange,
  descriptionHtml,
  onDescriptionChange,
  tags,
  onTagsChange,
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && !tags.includes(value)) {
        onTagsChange([...tags, value]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: FONT }}>
      {/* Product Name */}
      <div>
        <input
          type="text"
          placeholder="Enter Product Name Here"
          value={productName}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 15,
            textAlign: 'center',
            border: `1px solid ${BS}`,
            borderRadius: 4,
            outline: 'none',
            color: TP,
            fontFamily: FONT,
            boxSizing: 'border-box',
            background: BG3,
          }}
        />
      </div>

      {/* Description — Rich Text */}
      <div>
        <ReactQuill
          theme="snow"
          value={descriptionHtml}
          onChange={onDescriptionChange}
          placeholder="Enter description here..."
          modules={{ toolbar: TOOLBAR_OPTIONS }}
          style={{
            background: BG3,
            borderRadius: 4,
            minHeight: 160,
            color: TP,
          }}
        />
      </div>

      {/* Tags */}
      <div>
        <div
          style={{
            border: `1px solid ${BS}`,
            borderRadius: 4,
            padding: 8,
            minHeight: 50,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 6,
            boxSizing: 'border-box',
            background: BG3,
          }}
        >
          {tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: BG2,
                borderRadius: 4,
                padding: '4px 8px',
                gap: 4,
                fontSize: 13,
                color: TP,
                border: `1px solid ${BS}`,
              }}
            >
              {tag}
              <button
                onClick={() => removeTag(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: TS,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Enter Your Product Tags Here..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 160,
              fontSize: 13,
              padding: '4px 0',
              fontFamily: FONT,
              color: TP,
              background: 'transparent',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsTab;
