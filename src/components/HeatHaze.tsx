import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HeatHazeProps {
  intensity: number; // 0-100, where higher = more heat
}

export const HeatHaze: React.FC<HeatHazeProps> = ({ intensity }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 800;

  // Create random positions for heat haze particles
  const [positions, phase] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 300; // x
      pos[i * 3 + 1] = Math.random() * 30; // y (low, rising from ground)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, ph];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Animate opacity based on intensity
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = THREE.MathUtils.lerp(
      material.opacity, 
      (intensity / 100) * 0.15, // Subtle heat haze
      0.05
    );

    // Heat rising animation
    const t = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Rising motion
      positions[i * 3 + 1] += 0.08;
      
      // Wavy horizontal motion (heat distortion)
      positions[i * 3] += Math.sin(t * 2 + phase[i]) * 0.05;
      positions[i * 3 + 2] += Math.cos(t * 2 + phase[i]) * 0.05;
      
      // Reset when too high
      if (positions[i * 3 + 1] > 30) {
        positions[i * 3 + 1] = 0;
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Create a soft circular texture for heat distortion
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,200,150,0.8)');
      grad.addColorStop(0.5, 'rgba(255,220,180,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
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
        size={20}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        color={0xffcc88}
      />
    </points>
  );
};
