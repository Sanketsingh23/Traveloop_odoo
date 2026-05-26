export default function Footer() {
  return (
    <footer
      style={{
        background: 'black',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontSize: '1.25rem',
          color: 'white',
          marginBottom: '0.5rem',
        }}
      >
        TRAVELLOOP
      </div>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.40)',
          margin: '0 0 0.5rem',
        }}
      >
        A place for all travellers to share their experiences and discover new places.
      </p>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.25)',
          margin: 0,
        }}
      >
        © 2025 TRAVELLOOP. All rights reserved.
      </p>
    </footer>
  );
}
