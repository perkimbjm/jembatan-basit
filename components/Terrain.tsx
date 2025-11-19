import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

export const Terrain: React.FC = () => {
  // Generate voxel terrain patches for River Banks (Wetlands/Flat)
  const terrainData = useMemo(() => {
    const items = [];
    
    // We need two banks, separated by the river (Z axis mostly open or under bridge)
    // Bridge spans X: -80 to 80 approx. River flows along Z presumably or X depending on orientation
    // Let's assume Bridge crosses river. So River is Z-aligned (actually scene setup has river plane everywhere at y=-2)
    // We place land masses at ends of bridge (X < -70 and X > 70)

    // Bank 1 (Barito Kuala Side)
    for (let x = -200; x < -80; x += 8) {
      for (let z = -150; z < 150; z += 8) {
        if (Math.random() > 0.2) {
            const height = 2 + Math.random() * 2; // Flat, low lying
            items.push({ x, z, y: height / 2 - 2, h: height, color: '#3a5f0b' }); // Dark tropical green
        }
      }
    }

    // Bank 2 (Banjarmasin Side)
    for (let x = 80; x < 200; x += 8) {
        for (let z = -150; z < 150; z += 8) {
            // More urban/houses
            const isBuilding = Math.random() > 0.6;
            const height = isBuilding ? 4 + Math.random() * 8 : 2;
            const color = isBuilding ? '#c2b280' : '#3a5f0b'; // Sand/Concrete vs Green
            items.push({ x, z, y: height / 2 - 2, h: height, color });
        }
    }

    return items;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), []);

  return (
    <group>
        <Instances range={terrainData.length} material={material}>
            <boxGeometry args={[8, 1, 8]} />
            {terrainData.map((t, i) => (
                <Instance 
                    key={i} 
                    position={[t.x, t.y, t.z]} 
                    scale={[1, t.h, 1]} 
                    color={t.color} 
                />
            ))}
        </Instances>
    </group>
  );
};