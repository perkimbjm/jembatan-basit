import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterSplashProps {
  carPosition: THREE.Vector3;
  carRotation: number;
  intensity: number; // 0-100 based on rain
}

// Component for individual car water splashes
export const WaterSplash: React.FC<WaterSplashProps> = ({ carPosition, carRotation, intensity }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 30;

  const [positions, velocities, lifetimes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const life = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Start at car position
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      
      // Random velocity (sideways and up)
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.3 + 0.1;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = Math.random() * 0.4 + 0.2; // upward
      vel[i * 3 + 2] = Math.sin(angle) * speed;
      
      life[i] = Math.random();
    }
    
    return [pos, vel, life];
  }, []);

  useFrame(() => {
    if (!pointsRef.current || intensity === 0) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    
    material.opacity = (intensity / 100) * 0.4;
    
    for (let i = 0; i < particleCount; i++) {
      // Update lifetime
      lifetimes[i] += 0.05;
      if (lifetimes[i] > 1) {
        lifetimes[i] = 0;
        // Reset position
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      }
      
      // Apply velocity
      positions[i * 3] += velocities[i * 3];
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Gravity
      velocities[i * 3 + 1] -= 0.02;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (intensity === 0) return null;

  return (
    <points ref={pointsRef} position={carPosition} rotation={[0, carRotation, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        transparent
        opacity={0}
        color={0xaaccff}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
