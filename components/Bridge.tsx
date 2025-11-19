import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface BridgeProps {
  isNight: boolean;
}

export const Bridge: React.FC<BridgeProps> = ({ isNight }) => {
  const spanLength = 220; 
  const pylonHeight = 75; 
  const curveIntensity = 50; 
  const deckWidth = 20; 
  const pylonBaseSpacing = 26; 

  // --- Procedural Textures ---
  const concreteMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#d4d4d8'; 
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 60000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#a1a1aa' : '#f4f4f5';
        ctx.globalAlpha = 0.08;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);

  const asphaltMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 100000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#27272a' : '#09090b';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  }, []);

  const materials = useMemo(() => ({
    pylon: new THREE.MeshStandardMaterial({ 
      map: concreteMap, 
      roughness: 0.5,
      bumpMap: concreteMap,
      bumpScale: 0.05,
      color: '#e0e0e0'
    }),
    concrete: new THREE.MeshStandardMaterial({ 
      map: concreteMap, 
      roughness: 0.8,
      bumpMap: concreteMap,
      bumpScale: 0.05,
      color: '#e0e0e0'
    }),
    sidewalk: new THREE.MeshStandardMaterial({ 
      map: concreteMap,
      roughness: 0.9,
      color: '#cccccc' 
    }),
    road: new THREE.MeshStandardMaterial({ 
      map: asphaltMap, 
      roughness: 0.9, 
      bumpMap: asphaltMap, 
      bumpScale: 0.02,
      color: '#333333'
    }),
    cable: new THREE.MeshStandardMaterial({ color: '#ff0000', roughness: 0.4, metalness: 0.1 }),
    redAccent: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.8 }),
    joint: new THREE.MeshStandardMaterial({ color: '#000000', roughness: 1.0 }),
    streetLight: new THREE.MeshStandardMaterial({ 
      color: '#ffaa00', 
      emissive: '#ffaa00', 
      emissiveIntensity: 2, 
      toneMapped: false 
    })
  }), [concreteMap, asphaltMap]); // Independent of isNight, updated in useFrame

  // Animate Lights (Chroma Cycle) & Update Materials based on Time
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Pylon Animation Logic
    if (isNight) {
      const hue = (time * 0.15) % 1; 
      const color = new THREE.Color().setHSL(hue, 1, 0.6);
      
      materials.pylon.color.copy(color);
      materials.pylon.emissive.copy(color);
      materials.pylon.emissiveIntensity = 1.5;
      materials.pylon.toneMapped = false; // Neon glow look
    } else {
      // Reset to Concrete look
      materials.pylon.color.set('#e0e0e0');
      materials.pylon.emissive.set('#000000');
      materials.pylon.emissiveIntensity = 0;
      materials.pylon.toneMapped = true;
    }

    // Street Light Logic
    materials.streetLight.emissiveIntensity = isNight ? 2 : 0;
  });

  const getCurveZ = (x: number) => {
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    return Math.cos(normalized) * curveIntensity - curveIntensity;
  };

  const getPylonPos = (h: number, side: 'left' | 'right') => {
      const t = h / pylonHeight; 
      const xBase = 0;
      
      const sideSign = side === 'left' ? 1 : -1;
      const zBase = sideSign * (pylonBaseSpacing / 2);
      // Outward curve (horns)
      const outwardCurve = sideSign * (t * t * 12); 
      const z = zBase + outwardCurve;

      // Forward lean
      const forwardLean = Math.sin(t * Math.PI / 2) * 15; 
      const x = xBase + forwardLean;
      const y = h - 8; 

      return new THREE.Vector3(x, y, z);
  };

  // Generate Smooth Curves for Solid Geometry
  const { leftCurve, rightCurve } = useMemo(() => {
      const pointsL = [];
      const pointsR = [];
      const segments = 20;
      
      for (let i = 0; i <= segments; i++) {
          const h = (i / segments) * pylonHeight;
          pointsL.push(getPylonPos(h, 'left'));
          pointsR.push(getPylonPos(h, 'right'));
      }
      
      return {
          leftCurve: new THREE.CatmullRomCurve3(pointsL),
          rightCurve: new THREE.CatmullRomCurve3(pointsR)
      };
  }, []);

  const cables = useMemo(() => {
    const newItems = [];
    const cableCount = 14; 
    const startXDeck = 15; 
    const endXDeck = 90;

    for (let i = 0; i < cableCount; i++) {
         const t = i / (cableCount - 1);
         const xDeckPos = startXDeck + (endXDeck - startXDeck) * t;
         const attachH = 25 + (t * (pylonHeight - 30)); 

         [-1, 1].forEach(dir => { 
             const x = xDeckPos * dir;
             const zCenter = getCurveZ(x);
             
             [-1, 1].forEach(side => { 
                 const sideName = side === 1 ? 'left' : 'right';
                 const deckZ = zCenter + (side * (deckWidth/2 - 0.5)); 
                 const pylonPoint = getPylonPos(attachH, sideName);

                 newItems.push({ 
                    start: pylonPoint, 
                    end: new THREE.Vector3(x, 4, deckZ),
                 });
             });
         });
    }
    return newItems;
  }, []);

  return (
    <group>
      {/* --- Solid Pylons (Full Tower Glows) --- */}
      {/* Left Tower */}
      <mesh material={materials.pylon} castShadow receiveShadow>
          <tubeGeometry args={[leftCurve, 64, 2.5, 12, false]} />
      </mesh>
      {/* Right Tower */}
      <mesh material={materials.pylon} castShadow receiveShadow>
          <tubeGeometry args={[rightCurve, 64, 2.5, 12, false]} />
      </mesh>

      {/* --- Pile Cap --- */}
      <mesh position={[8, -5, 0]} material={materials.concrete} receiveShadow>
        <boxGeometry args={[30, 10, 50]} /> 
      </mesh>

      {/* --- Deck Segments --- */}
      <Instances range={300} material={materials.concrete} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2, deckWidth]} /> 
        {Array.from({ length: 120 }).map((_, i) => {
            const t = (i / 120) * 2 - 1; 
            const x = t * (spanLength / 2);
            const z = getCurveZ(x);
            
            const k = Math.PI / 2 / (spanLength / 1.8);
            const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
            const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
            const rotY = Math.atan(dzdx);

            const isJoint = i % 10 === 0 && i !== 0 && i !== 120;

            return (
                <group key={i}>
                    {/* Concrete Base */}
                    {!isJoint && <Instance position={[x, 3, z]} rotation={[0, -rotY, 0]} />}
                    
                    {/* Expansion Joint */}
                    {isJoint && (
                        <mesh position={[x, 3.1, z]} rotation={[0, -rotY, 0]} material={materials.joint}>
                            <boxGeometry args={[0.4, 1.9, deckWidth - 0.2]} />
                        </mesh>
                    )}

                    {/* --- Surface & Details --- */}
                    <group position={[x, 0, z]} rotation={[0, -rotY, 0]}>
                        {/* Left Road Lane */}
                        <mesh position={[0, 4.05, 4]} material={materials.road} receiveShadow>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>
                        {/* Right Road Lane */}
                        <mesh position={[0, 4.05, -4]} material={materials.road} receiveShadow>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>

                        {/* Median */}
                        <mesh position={[0, 4.2, 0]} material={materials.concrete}>
                            <boxGeometry args={[2.5, 0.4, 1]} />
                        </mesh>

                        {/* --- Jalur Pedestrian (Trotoar) --- */}
                        {/* Sisi Kiri (+Z arah keluar dari pusat jalan +4) */}
                        <mesh position={[0, 4.2, 8.5]} material={materials.sidewalk} receiveShadow>
                             <boxGeometry args={[2.5, 0.3, 2]} /> 
                        </mesh>
                        {/* Sisi Kanan (-Z arah keluar dari pusat jalan -4) */}
                        <mesh position={[0, 4.2, -8.5]} material={materials.sidewalk} receiveShadow>
                             <boxGeometry args={[2.5, 0.3, 2]} />
                        </mesh>

                        {/* Railings */}
                        <mesh position={[0, 4.5, deckWidth/2 - 0.5]} material={materials.steel}>
                            <boxGeometry args={[0.2, 1.2, 0.2]} />
                        </mesh>
                        <mesh position={[0, 4.5, -deckWidth/2 + 0.5]} material={materials.steel}>
                            <boxGeometry args={[0.2, 1.2, 0.2]} />
                        </mesh>
                        
                        {/* Railing Bars */}
                        <mesh position={[0, 4.8, deckWidth/2 - 0.5]} material={materials.redAccent}>
                            <boxGeometry args={[2.6, 0.1, 0.1]} />
                        </mesh>
                        <mesh position={[0, 4.8, -deckWidth/2 + 0.5]} material={materials.redAccent}>
                            <boxGeometry args={[2.6, 0.1, 0.1]} />
                        </mesh>
                    </group>
                </group>
            )
        })}
      </Instances>

      {/* --- Cables --- */}
      {cables.map((c, i) => {
        const midX = (c.start.x + c.end.x) / 2;
        const midY = (c.start.y + c.end.y) / 2;
        const midZ = (c.start.z + c.end.z) / 2;
        
        const vec = new THREE.Vector3().subVectors(c.end, c.start);
        const len = vec.length();
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, vec.normalize());
        const rotation = new THREE.Euler().setFromQuaternion(quaternion);

        return (
          <mesh 
            key={`cab-${i}`} 
            position={[midX, midY, midZ]} 
            rotation={rotation}
            material={materials.cable}
          >
            <cylinderGeometry args={[0.15, 0.15, len, 4]} />
          </mesh>
        )
      })}

      {/* --- Street Lights --- */}
      <Instances range={60} material={materials.streetLight}>
         <sphereGeometry args={[0.3, 8, 8]} />
         {Array.from({ length: 15 }).map((_, i) => {
             const t = (i / 14) * 2 - 1;
             const x = t * (spanLength / 2);
             if (Math.abs(x) < 15) return null; 

             const z = getCurveZ(x);
             
             const k = Math.PI / 2 / (spanLength / 1.8);
             const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
             const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
             const rotY = Math.atan(dzdx);
             
             return (
                 <group key={i} position={[x, 4, z]} rotation={[0, -rotY, 0]}>
                     <mesh position={[0, 3, 0]} material={materials.steel}>
                         <cylinderGeometry args={[0.15, 0.2, 6]} />
                     </mesh>
                     <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI/2]} material={materials.steel}>
                         <cylinderGeometry args={[0.1, 0.1, 8]} /> 
                     </mesh>
                     <Instance position={[0, 5.8, 3]} />
                     <Instance position={[0, 5.8, -3]} />
                 </group>
             )
         })}
      </Instances>

    </group>
  );
};