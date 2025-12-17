import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainProps {
  intensity: number; // 0-100, where higher = heavier rain
}

export const Rain: React.FC<RainProps> = ({ intensity }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000; // More particles for rain

  // Create random positions for rain drops
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 300; // x
      pos[i * 3 + 1] = Math.random() * 100; // y (high in sky)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 300; // z
      vel[i] = 2 + Math.random() * 2; // falling speed variation
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    
    // Animate opacity based on intensity
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = THREE.MathUtils.lerp(
      material.opacity, 
      (intensity / 100) * 0.6, // Max opacity 0.6
      0.05
    );

    // Rain falling animation
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Fall down
      positions[i * 3 + 1] -= velocities[i];
      
      // Slight wind drift
      positions[i * 3] += 0.1;
      
      // Reset when hitting ground
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 100;
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      }
      
      // Wrap around horizontally
      if (positions[i * 3] > 150) positions[i * 3] = -150;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Create a line texture for rain drops
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 16);
      grad.addColorStop(0, 'rgba(200,220,255,0)');
      grad.addColorStop(0.3, 'rgba(200,220,255,1)');
      grad.addColorStop(1, 'rgba(200,220,255,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 16);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Don't render if intensity is 0
  if (intensity === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.NormalBlending}
        sizeAttenuation={true}
        color={0xccddff}
      />
    </points>
  );
};
