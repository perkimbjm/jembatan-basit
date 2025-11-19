
import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

interface TerrainProps {
  isNight: boolean;
}

interface BlockData {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color?: string;
}

export const Terrain: React.FC<TerrainProps> = ({ isNight }) => {
  
  // --- Procedural Window Texture ---
  const windowTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#444444'; // Wall color
      ctx.fillRect(0, 0, size, size);
      
      const rows = 4;
      const cols = 4;
      const pad = 2;
      const w = (size - pad * (cols + 1)) / cols;
      const h = (size - pad * (rows + 1)) / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isLit = Math.random() > 0.3; 
          ctx.fillStyle = isLit ? '#ffffaa' : '#222233';
          ctx.fillRect(pad + c * (w + pad), pad + r * (h + pad), w, h);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  // --- Geometry Generation ---
  const data = useMemo(() => {
    const ground: BlockData[] = [];
    const buildings: BlockData[] = [];
    const roofs: BlockData[] = [];
    const roads: BlockData[] = [];

    // OPTIMIZATION: Reduced range from 250/200 to 180/150 to improve FPS
    const minX = -180;
    const maxX = 180;
    const minZ = -150;
    const maxZ = 150;
    
    const blockSize = 48;
    const roadWidth = 10;

    // Step of 8 for voxel alignment
    for (let x = minX; x <= maxX; x += 8) {
      for (let z = minZ; z <= maxZ; z += 8) {
        
        // River Channel (Keep clear for bridge/water)
        if (x > -60 && x < 60) continue; 

        // Identify Sides
        const isCitySide = x > 60; // East side (Banjarmasin)
        const groundY = -2; 
        
        if (!isCitySide) {
          // Nature Side
          const isTree = Math.random() > 0.85;
          const height = isTree ? 3 + Math.random() * 5 : 0.5;
          ground.push({ 
            x: x, 
            z: z, 
            y: groundY + height / 2, 
            sx: 8, 
            sy: height, 
            sz: 8, 
            color: isTree ? '#2d4c1e' : '#3a5f0b' 
          });
        } else {
          // City Side
          const absX = Math.abs(x);
          const absZ = Math.abs(z);
          
          const modX = absX % blockSize;
          const modZ = absZ % blockSize;
          const isRoadX = modX < roadWidth;
          const isRoadZ = modZ < roadWidth;

          if (isRoadX || isRoadZ) {
            // Road
            roads.push({
              x: x, 
              z: z, 
              y: groundY + 0.1,
              sx: 8, 
              sy: 0.2, 
              sz: 8
            });
          } else {
            // City Block
            const isBuilding = Math.random() > 0.2;

            if (isBuilding) {
               const buildingHeight = 8 + Math.random() * 12 + (Math.random() > 0.9 ? 12 : 0); 
               const buildingColor = Math.random() > 0.5 ? '#e0e0e0' : '#d1cfcd';
               
               buildings.push({
                 x: x, 
                 z: z, 
                 y: groundY + buildingHeight / 2,
                 sx: 7, 
                 sy: buildingHeight, 
                 sz: 7,
                 color: buildingColor
               });

               // Roof Details
               if (Math.random() > 0.5) {
                 roofs.push({
                   x: x + (Math.random() - 0.5) * 2,
                   z: z + (Math.random() - 0.5) * 2,
                   y: groundY + buildingHeight + 0.5,
                   sx: 2, 
                   sy: 1, 
                   sz: 2
                 });
               }
            } else {
               // Empty lot
               ground.push({
                  x: x, 
                  z: z, 
                  y: groundY + 0.2,
                  sx: 8, 
                  sy: 0.4, 
                  sz: 8,
                  color: '#555'
               });
            }
          }
        }
      }
    }
    return { ground, buildings, roofs, roads };
  }, []);

  return (
    <group>
      {/* Nature & Lots */}
      <Instances range={data.ground.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a5f0b" roughness={1} />
        {data.ground.map((d, i) => (
          <Instance
            key={i}
            position={[d.x, d.y, d.z]}
            scale={[d.sx, d.sy, d.sz]}
            color={d.color}
          />
        ))}
      </Instances>

      {/* Roads */}
      <Instances range={data.roads.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
        {data.roads.map((d, i) => (
          <Instance
            key={i}
            position={[d.x, d.y, d.z]}
            scale={[d.sx, d.sy, d.sz]}
          />
        ))}
      </Instances>

      {/* Buildings */}
      <Instances range={data.buildings.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          map={windowTexture} 
          color="#ffffff"
          roughness={0.3} 
          emissiveMap={windowTexture}
          emissive="#ffffff"
          emissiveIntensity={isNight ? 1.5 : 0}
        />
        {data.buildings.map((d, i) => (
          <Instance
            key={i}
            position={[d.x, d.y, d.z]}
            scale={[d.sx, d.sy, d.sz]}
            color={d.color}
          />
        ))}
      </Instances>

      {/* Roof Details */}
      <Instances range={data.roofs.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#444" roughness={0.5} />
        {data.roofs.map((d, i) => (
          <Instance
            key={i}
            position={[d.x, d.y, d.z]}
            scale={[d.sx, d.sy, d.sz]}
          />
        ))}
      </Instances>
    </group>
  );
};
