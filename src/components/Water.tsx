import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface WaterProps {
  sunPosition: THREE.Vector3;
  time: number;
}

export const Water: React.FC<WaterProps> = ({ sunPosition, time }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate subtle wave movement by adjusting position slightly
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle vertical oscillation to simulate water movement
      const elapsed = state.clock.getElapsedTime();
      meshRef.current.position.y = -2 + Math.sin(elapsed * 0.5) * 0.1;
    }
  });

  // Calculate water color based on sun position (day/night)
  const sunHeight = sunPosition.y;
  const isNight = sunHeight < 0;
  
  // Interpolate water color based on time of day
  const dayColor = new THREE.Color(BRIDGE_COLORS.water);
  const nightColor = new THREE.Color('#0a1628');
  const waterColor = isNight ? nightColor : dayColor.lerp(nightColor, Math.max(0, -sunHeight / 100));

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]}
      receiveShadow
    >
      <planeGeometry args={[1000, 1000, 1, 1]} />
      <MeshReflectorMaterial
        blur={[300, 100]} // Blur ground reflections (width, height)
        resolution={1024} // Off-buffer resolution
        mixBlur={1} // How much blur mixes with surface roughness
        mixStrength={50} // Strength of the reflections
        roughness={1}
        depthScale={1.2} // Scale depth factor
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={waterColor}
        metalness={0.5}
        mirror={0.5} // Mirror reflections (0-1)
      />
    </mesh>
  );
};
