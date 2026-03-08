export default function SkeletonCard() {
  return (
    <div style={{ background: '#141416' }}>
      <div style={{ aspectRatio: '1/1', background: '#1C1C1F', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ height: '10px', width: '33%', background: '#1C1C1F', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '14px', width: '66%', background: '#1C1C1F', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '16px', width: '25%', background: '#1C1C1F', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
