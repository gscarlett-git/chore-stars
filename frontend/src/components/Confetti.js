import React, { useEffect, useState } from 'react';

export function Confetti({ active, onDone }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) return;
    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A855F7', '#45B7D1', '#FFA552', '#6BCB77', '#FF69B4'];
    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
      size: 8 + Math.random() * 8,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
      if (onDone) onDone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, onDone]);

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}
