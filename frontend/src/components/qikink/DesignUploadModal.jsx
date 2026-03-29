import React, { useRef } from 'react';
import { QK } from '@/config/qikinkTheme';

// Caesura dark theme overrides
const BG = '#0A0A0B';
const BG2 = '#111113';
const BG3 = '#1A1A1C';
const TP = '#FAFAF9';
const TS = 'rgba(250,250,249,0.55)';
const TT = 'rgba(250,250,249,0.25)';
const BS = 'rgba(250,250,249,0.08)';
const AS = '#C8FF00';
const FONT = '"DM Sans", system-ui, sans-serif';

const DesignUploadModal = ({
  open,
  onClose,
  onDesignSelected,
  onLibrarySelect,
  library = [],
  libraryLoading = false,
}) => {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!open) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onDesignSelected(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onDesignSelected(file);
  };

  const filteredLibrary = library.filter((item) =>
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 900,
          width: '90%',
          background: BG2,
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${BS}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: `1px solid ${BS}`,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: TP,
            }}
          >
            Upload Design
          </h4>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: TS,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 24,
            padding: 24,
          }}
        >
          {/* Left Column — Dropzone */}
          <div style={{ flex: 1 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                background: 'rgba(200,255,0,0.04)',
                border: `2px dashed ${AS}`,
                borderRadius: 8,
                minHeight: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 48, color: AS }}>☁</span>
              <span
                style={{
                  fontSize: 16,
                  color: TP,
                  fontWeight: 600,
                }}
              >
                Upload Your Design Here
              </span>
              <span style={{ fontSize: 12, color: TS }}>
                Drop files here or click to upload
              </span>
              <span style={{ fontSize: 11, color: TT, marginTop: 4 }}>
                PNG, JPG, WEBP up to 20MB
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Right Column — Design Library */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h5
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: TP,
                  whiteSpace: 'nowrap',
                }}
              >
                My Design Library
              </h5>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: `1px solid ${BS}`,
                  padding: 8,
                  fontSize: 13,
                  borderRadius: 4,
                  outline: 'none',
                  width: '100%',
                  maxWidth: 180,
                  fontFamily: FONT,
                  background: BG3,
                  color: TP,
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 250,
              }}
            >
              {libraryLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: TS,
                    fontSize: 14,
                  }}
                >
                  Loading...
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: TS,
                    fontSize: 14,
                  }}
                >
                  No Designs Found
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {filteredLibrary.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.image_url}
                      alt={item.title || 'Design'}
                      onClick={() => onLibrarySelect(item.image_url)}
                      style={{
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: `1px solid ${BS}`,
                        width: '100%',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignUploadModal;
