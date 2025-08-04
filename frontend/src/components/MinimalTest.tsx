import { useState } from 'react';

const MinimalTest = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Minimal Test</h1>
        <p className="text-xl mb-4">Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Increment
        </button>
      </div>
    </div>
  );
};

export default MinimalTest;
