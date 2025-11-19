import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

interface ShipsProps {
  isNight: boolean;
}

export const Ships: React.FC<ShipsProps> = ({ isNight }) => {
  const groupRef = useRef<THREE.Group>(null);

  const ships = useMemo(() => [
    { id: 1, z: 60, speed: 0.05, offset: 0 },
    { id: 2, z: -80, speed: -0.03, offset: 50 },
    { id: 3, z: 150, speed: 0.08, offset: 20 },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      ships.forEach((ship, index) => {
        const child = groupRef.current!.children[index];
        if (child) {
          // Simple linear movement
          const t = state.clock.getElapsedTime();
          let x = ((t * ship.speed * 100) + ship.offset) % 400;
          if (x > 200) x -= 400;
          if (x < -200) x += 400;
          
          child.position.x = x;
          child.position.z = ship.z;
          // Bobbing effect
          child.position.y = Math.sin(t * 2 + ship.id) * 0.5 - 1; 
        }
      });
    }
  });

  // Materials
  const hullMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#331100' }), []);
  const containerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#224488' }), []);
  const whiteLight = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false }), []);
  const redLight = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff0000', toneMapped: false }), []);
  const greenLight = useMemo(() => new THREE.MeshBasicMaterial({ color: '#00ff00', toneMapped: false }), []);

  return (
    <group ref={groupRef}>
      {ships.map((ship) => (
        <group key={ship.id}>
          {/* Hull */}
          <mesh material={hullMat} position={[0, 1, 0]}>
            <boxGeometry args={[30, 4, 8]} />
          </mesh>
          
          {/* Cabin */}
          <mesh material={hullMat} position={[-10, 4, 0]}>
            <boxGeometry args={[6, 6, 6]} />
          </mesh>

          {/* Containers */}
          <mesh material={containerMat} position={[5, 3.5, 0]}>
            <boxGeometry args={[18, 3, 6]} />
          </mesh>

          {/* Navigation Lights */}
          {isNight && (
            <>
              {/* Mast Light (White) */}
              <mesh material={whiteLight} position={[-10, 8, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
              </mesh>
              {/* Port (Red) */}
              <mesh material={redLight} position={[0, 3, 4.1]}>
                <boxGeometry args={[0.5, 0.5, 0.1]} />
              </mesh>
              {/* Starboard (Green) */}
              <mesh material={greenLight} position={[0, 3, -4.1]}>
                <boxGeometry args={[0.5, 0.5, 0.1]} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
};
