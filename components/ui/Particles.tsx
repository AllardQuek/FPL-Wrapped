'use client';

import { useState, useEffect } from 'react';

interface ParticlesProps {
  className?: string;
  quantity?: number;
}

export function Particles({ className = '', quantity = 20 }: ParticlesProps) {
  const [particles, setParticles] = useState<Array<{ left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      setParticles(Array.from({ length: quantity }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 15 + Math.random() * 10,
      })));
    };

    // Use requestAnimationFrame to avoid the "sync setState in effect" error
    // and ensure the update happens in the next frame after mounting
    const rafId = requestAnimationFrame(generateParticles);
    return () => cancelAnimationFrame(rafId);
  }, [quantity]);

  return (
    <div className={`particles ${className}`}>
      {particles.map((particle, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
