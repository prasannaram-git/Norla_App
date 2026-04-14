export default function AuthLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#FAFBFC',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '3px solid #EBEEF2',
          borderTopColor: '#10B981',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: '#8D96A0',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontWeight: 500,
        }}
      >
        Loading...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
