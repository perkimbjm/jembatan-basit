import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Water Hyacinth (Enceng Gondok) Component - Floating plants
const WaterHyacinth: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialY = position[1];
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating motion
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = initialY + Math.sin(time * 0.5 + phaseOffset) * 0.1;
      groupRef.current.rotation.z = Math.sin(time * 0.3 + phaseOffset) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base floating pad */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
        <cylinderGeometry args={[1.5, 1.2, 0.3, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos(i * Math.PI / 3) * 0.8,
            0.2,
            Math.sin(i * Math.PI / 3) * 0.8
          ]}
          rotation={[-Math.PI / 3 + Math.random() * 0.3, i * Math.PI / 3, 0]}
        >
          <sphereGeometry args={[0.4, 6, 4, 0, Math.PI]} />
          <meshStandardMaterial color="#4ade80" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Purple flower */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.2, 0.6, 6]} />
        <meshStandardMaterial color="#9333ea" roughness={0.7} />
      </mesh>
    </group>
  );
};

// Nipah Palm Tree Component - Swamp palm trees
const NipahPalm: React.FC<{ position: [number, number, number]; scale?: number }> = ({ 
  position, 
  scale = 1 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle swaying
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(time * 0.2 + phaseOffset) * 0.02;
      groupRef.current.rotation.x = Math.cos(time * 0.15 + phaseOffset) * 0.02;
    }
  });

  const trunkHeight = 4 * scale;
  const frondCount = 8 + Math.floor(Math.random() * 4);

  return (
    <group ref={groupRef} position={position}>
      {/* Trunk - nipah palms have short, stout trunks */}
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.3 * scale, 0.5 * scale, trunkHeight, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={1} />
      </mesh>
      
      {/* Fronds (palm leaves) */}
      {Array.from({ length: frondCount }).map((_, i) => {
        const angle = (i / frondCount) * Math.PI * 2;
        const tilt = Math.PI / 4 + Math.random() * 0.3;
        return (
          <group 
            key={i} 
            position={[0, trunkHeight, 0]}
            rotation={[tilt, angle, 0]}
          >
            {/* Main frond stem */}
            <mesh position={[0, 2 * scale, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.1 * scale, 4 * scale, 0.05 * scale]} />
              <meshStandardMaterial color="#365c28" roughness={0.9} />
            </mesh>
            {/* Leaflets along the frond */}
            {Array.from({ length: 8 }).map((_, j) => (
              <mesh 
                key={j}
                position={[
                  (j % 2 === 0 ? 0.4 : -0.4) * scale,
                  (j * 0.5 + 0.5) * scale,
                  0
                ]}
                rotation={[0, 0, (j % 2 === 0 ? 0.3 : -0.3)]}
              >
                <boxGeometry args={[0.8 * scale, 0.1 * scale, 0.02 * scale]} />
                <meshStandardMaterial color="#22c55e" roughness={0.8} />
              </mesh>
            ))}
          </group>
        );
      })}
      
      {/* Fruit cluster (for some trees) */}
      {Math.random() > 0.5 && (
        <group position={[0.5 * scale, trunkHeight - 0.5, 0]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh 
              key={i} 
              position={[
                Math.random() * 0.3,
                -i * 0.2,
                Math.random() * 0.3 - 0.15
              ]}
            >
              <sphereGeometry args={[0.15 * scale, 6, 6]} />
              <meshStandardMaterial color="#854d0e" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

// Mangrove/Swamp Tree Component
const MangroveTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({ 
  position, 
  scale = 1 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(time * 0.1 + phaseOffset) * 0.01;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Stilt roots */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * 0.8 * scale,
              1 * scale,
              Math.sin(angle) * 0.8 * scale
            ]}
            rotation={[Math.cos(angle) * 0.4, 0, -Math.sin(angle) * 0.4]}
          >
            <cylinderGeometry args={[0.08 * scale, 0.15 * scale, 3 * scale, 4]} />
            <meshStandardMaterial color="#5c4033" roughness={1} />
          </mesh>
        );
      })}
      
      {/* Main trunk */}
      <mesh position={[0, 3 * scale, 0]}>
        <cylinderGeometry args={[0.2 * scale, 0.3 * scale, 4 * scale, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={1} />
      </mesh>
      
      {/* Canopy */}
      <mesh position={[0, 5.5 * scale, 0]}>
        <sphereGeometry args={[2 * scale, 8, 6]} />
        <meshStandardMaterial color="#1a472a" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Terrain: React.FC = () => {
  // Generate voxel terrain patches for River Banks (Wetlands/Flat)
  const terrainData = useMemo(() => {
    const items = [];
    
    // Bank 1 (Barito Kuala Side) - More rural/swampy
    for (let x = -200; x < -80; x += 8) {
      for (let z = -150; z < 150; z += 8) {
        if (Math.random() > 0.2) {
            const height = 2 + Math.random() * 2;
            items.push({ x, z, y: height / 2 - 2, h: height, color: '#3a5f0b' });
        }
      }
    }

    // Bank 2 (Banjarmasin Side) - More urban
    for (let x = 80; x < 200; x += 8) {
        for (let z = -150; z < 150; z += 8) {
            const isBuilding = Math.random() > 0.6;
            const height = isBuilding ? 4 + Math.random() * 8 : 2;
            const color = isBuilding ? '#c2b280' : '#3a5f0b';
            items.push({ x, z, y: height / 2 - 2, h: height, color });
        }
    }

    return items;
  }, []);

  // Generate water hyacinth positions along river edges
  const hyacinthData = useMemo(() => {
    const items: [number, number, number][] = [];
    
    // Along Barito Kuala bank (left side of river)
    for (let x = -85; x > -100; x -= 5) {
      for (let z = -120; z < 120; z += 8 + Math.random() * 10) {
        if (Math.random() > 0.4) {
          items.push([x + Math.random() * 3, -1.5, z + Math.random() * 5]);
        }
      }
    }
    
    // Along Banjarmasin bank (right side of river)
    for (let x = 85; x < 100; x += 5) {
      for (let z = -120; z < 120; z += 8 + Math.random() * 10) {
        if (Math.random() > 0.4) {
          items.push([x + Math.random() * 3, -1.5, z + Math.random() * 5]);
        }
      }
    }
    
    // Scattered in the middle of river (away from bridge)
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = Math.random() > 0.5 
        ? 80 + Math.random() * 60  // Far from bridge
        : -80 - Math.random() * 60;
      items.push([x, -1.5, z]);
    }
    
    return items;
  }, []);

  // Generate nipah palm positions along riverbanks
  const nipahData = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number }[] = [];
    
    // Barito Kuala bank (more dense vegetation)
    for (let z = -140; z < 140; z += 12 + Math.random() * 8) {
      const x = -82 - Math.random() * 15;
      if (Math.random() > 0.3) {
        items.push({ 
          pos: [x, 0, z + Math.random() * 5], 
          scale: 0.8 + Math.random() * 0.5 
        });
      }
    }
    
    // Banjarmasin bank (less dense, more urban)
    for (let z = -140; z < 140; z += 20 + Math.random() * 15) {
      const x = 82 + Math.random() * 10;
      if (Math.random() > 0.5) {
        items.push({ 
          pos: [x, 0, z + Math.random() * 5], 
          scale: 0.7 + Math.random() * 0.4 
        });
      }
    }
    
    return items;
  }, []);

  // Generate mangrove tree positions
  const mangroveData = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number }[] = [];
    
    // Along the wetland areas
    for (let z = -130; z < 130; z += 15 + Math.random() * 10) {
      // Barito Kuala side
      if (Math.random() > 0.4) {
        items.push({ 
          pos: [-90 - Math.random() * 20, -1, z + Math.random() * 8], 
          scale: 0.6 + Math.random() * 0.4 
        });
      }
      // Banjarmasin side (fewer)
      if (Math.random() > 0.7) {
        items.push({ 
          pos: [90 + Math.random() * 15, -1, z + Math.random() * 8], 
          scale: 0.5 + Math.random() * 0.3 
        });
      }
    }
    
    return items;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), []);

  return (
    <group>
      {/* Terrain blocks */}
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

      {/* Water Hyacinth (Enceng Gondok) */}
      {hyacinthData.map((pos, i) => (
        <WaterHyacinth key={`hyacinth-${i}`} position={pos} />
      ))}

      {/* Nipah Palm Trees */}
      {nipahData.map((item, i) => (
        <NipahPalm 
          key={`nipah-${i}`} 
          position={item.pos} 
          scale={item.scale} 
        />
      ))}

      {/* Mangrove Trees */}
      {mangroveData.map((item, i) => (
        <MangroveTree 
          key={`mangrove-${i}`} 
          position={item.pos} 
          scale={item.scale} 
        />
      ))}
    </group>
  );
};