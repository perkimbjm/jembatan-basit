import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FogProps {
  density: number;
}

export const FogParticles: React.FC<FogProps> = ({ density }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  // Create random positions for fog particles
  const [positions, phase] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400; // x
      pos[i * 3 + 1] = Math.random() * 20 + 2; // y (low to water)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, ph];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Animate opacity based on density slider
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = THREE.MathUtils.lerp(material.opacity, density / 300, 0.05); // Scale density to opacity

    // Drift animation
    const t = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
        // Gentle bobbing
        positions[i * 3 + 1] += Math.sin(t * 0.5 + phase[i]) * 0.02;
        
        // Slow drift X
        positions[i * 3] += 0.05;
        if (positions[i * 3] > 200) positions[i * 3] = -200;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

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
        size={15}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        color={0xffffff}
      />
    </points>
  );
};
