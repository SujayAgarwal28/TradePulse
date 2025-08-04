import { useState } from 'react';

const SuperMinimalTest = () => {
  const [count, setCount] = useState(0);

  console.log('SuperMinimalTest rendering, count:', count);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Super Minimal Test</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Count: {count}</p>
        <button 
          onClick={() => {
            console.log('Button clicked, incrementing count from', count, 'to', count + 1);
            setCount(count + 1);
          }}
          style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
        >
          Increment
        </button>
      </div>
    </div>
  );
};

export default SuperMinimalTest;
