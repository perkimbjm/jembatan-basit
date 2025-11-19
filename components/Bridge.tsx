import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface BridgeProps {
  isNight: boolean;
}

export const Bridge: React.FC<BridgeProps> = ({ isNight }) => {
  const spanLength = 220; // Sedikit lebih panjang
  const pylonHeight = 75; // Lebih tinggi
  const curveIntensity = 50; // Lengkungan jalan
  const deckWidth = 16; // Lebar total dek
  const pylonBaseSpacing = 22; // Jarak antar pylon di bawah (agar jalan bisa lewat)

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
    concrete: new THREE.MeshStandardMaterial({ 
      map: concreteMap, 
      roughness: 0.8,
      bumpMap: concreteMap,
      bumpScale: 0.05,
      color: '#e0e0e0'
    }),
    road: new THREE.MeshStandardMaterial({ 
      map: asphaltMap, 
      roughness: 0.9, 
      bumpMap: asphaltMap, 
      bumpScale: 0.02,
      color: '#333333'
    }),
    cable: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.1 }),
    redAccent: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.8 }),
    joint: new THREE.MeshStandardMaterial({ color: '#000000', roughness: 1.0 }),
    light: new THREE.MeshStandardMaterial({ 
      color: '#ff00ff', 
      emissive: '#ff00ff', 
      emissiveIntensity: isNight ? 3 : 0, 
      toneMapped: false 
    }),
    streetLight: new THREE.MeshStandardMaterial({ 
      color: '#ffaa00', 
      emissive: '#ffaa00', 
      emissiveIntensity: isNight ? 2 : 0, 
      toneMapped: false 
    })
  }), [isNight, concreteMap, asphaltMap]);

  // Animate Lights (Chroma Cycle)
  useFrame((state) => {
    if (isNight) {
      const time = state.clock.getElapsedTime();
      const hue = (time * 0.1) % 1; 
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      materials.light.color.copy(color);
      materials.light.emissive.copy(color);
    }
  });

  // Curve Function for Deck: Puncak kurva di X=0 (tengah pylon)
  const getCurveZ = (x: number) => {
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    // Cosine curve: Puncak di 0, turun ke samping
    return Math.cos(normalized) * curveIntensity - curveIntensity;
  };

  // Pylon Curve Function
  // Dua tiang terpisah, mengapit jalan.
  // Jalan lewat di Z=0 (relatif terhadap kurva).
  // Tiang kiri di Z positif, Tiang kanan di Z negatif.
  const getPylonPos = (h: number, side: 'left' | 'right') => {
      const t = h / pylonHeight; // 0 to 1
      
      // Base position: X=0 (tengah jembatan secara longitudinal)
      const xBase = 0;
      
      // Z Position:
      // Base spacing +/- 11 (total gap 22).
      // Melengkung keluar semakin ke atas (V shape opening)
      const sideSign = side === 'left' ? 1 : -1;
      const zBase = sideSign * (pylonBaseSpacing / 2);
      const outwardCurve = sideSign * (t * t * 12); // Melengkung keluar 12 unit
      const z = zBase + outwardCurve;

      // X Position (Leaning forward):
      // Tiang condong ke depan (arah positif X)
      const forwardLean = Math.sin(t * Math.PI / 2) * 15; 
      const x = xBase + forwardLean;

      const y = h - 8; // Mulai dari dalam air/tanah

      return new THREE.Vector3(x, y, z);
  };

  // --- Cable Logic ---
  const cables = useMemo(() => {
    const newItems = [];
    const cableCount = 14; 
    
    // Kabel menyebar dari deck (X) ke Pylon
    // Area deck yang digantung kabel: X = 20 sampai X = 100 (satu sisi)
    const startXDeck = 15; 
    const endXDeck = 90;

    for (let i = 0; i < cableCount; i++) {
         const t = i / (cableCount - 1);
         const xDeckPos = startXDeck + (endXDeck - startXDeck) * t;
         
         // Posisi sambungan di Pylon (semakin jauh xDeck, semakin tinggi di pylon)
         // Kabel terpanjang (xDeck besar) dihubungkan ke puncak pylon
         const attachH = 25 + (t * (pylonHeight - 30)); 

         // Arah jembatan (depan/belakang dari pylon)
         // Jembatan asimetris di Alalak, tapi kita simulasikan simetris untuk visual
         [-1, 1].forEach(dir => { 
             const x = xDeckPos * dir;
             const zCenter = getCurveZ(x);
             
             // Kiri dan Kanan
             [-1, 1].forEach(side => { 
                 const sideName = side === 1 ? 'left' : 'right';
                 
                 // Titik di Deck (Tepi luar)
                 const deckZ = zCenter + (side * (deckWidth/2 - 0.5)); 
                 
                 // Titik di Pylon
                 const pylonPoint = getPylonPos(attachH, sideName);

                 newItems.push({ 
                    start: pylonPoint, 
                    end: new THREE.Vector3(x, 4, deckZ),
                    dist: pylonPoint.distanceTo(new THREE.Vector3(x, 4, deckZ))
                 });
             });
         });
    }
    return newItems;
  }, []);

  // Generate Pylon Voxels
  const pylonVoxels = useMemo(() => {
      const voxels = [];
      const steps = 50; // Resolution
      for(let i=0; i<=steps; i++) {
          const h = (i/steps) * pylonHeight;
          
          // Hitung rotasi agar balok mengikuti lengkungan
          const nextH = ((i+1)/steps) * pylonHeight;
          
          // Left Pylon
          const pL = getPylonPos(h, 'left');
          const pL_next = getPylonPos(nextH, 'left');
          const vecL = pL_next.clone().sub(pL).normalize();
          const rotZL = -Math.atan2(vecL.z - (pL.z > 0 ? 0 : 0), vecL.y); // Simplifikasi rotasi Z
          const rotXL = -Math.atan2(vecL.x, vecL.y);

          voxels.push({ pos: pL, rot: [rotXL, 0, 0], isLight: false, side: 'left' }); // Z rot removed for voxel stack look

          // Right Pylon
          const pR = getPylonPos(h, 'right');
           // Rotasi simetris
          voxels.push({ pos: pR, rot: [rotXL, 0, 0], isLight: false, side: 'right' });
      }
      return voxels;
  }, []);

  return (
    <group>
      {/* --- Pylons (Two Separate Towers) --- */}
      <Instances range={200} material={materials.concrete}>
        <boxGeometry args={[5, 2, 4]} /> {/* Balok besar penumpuk pylon */}
        {pylonVoxels.map((v, i) => (
            <Instance 
                key={i} 
                position={v.pos} 
                rotation={new THREE.Euler(v.rot[0], 0, v.side === 'left' ? -0.15 : 0.15)} 
            />
        ))}
      </Instances>

      {/* --- Decorative Lights on Pylons (Sisi Luar) --- */}
      {isNight && (
          <Instances range={200} material={materials.light}>
            <planeGeometry args={[4, 1]} /> 
            {pylonVoxels.map((v, i) => {
                if (i % 2 !== 0) return null;
                // Tempel lampu di sisi luar pylon
                const offsetZ = v.side === 'left' ? 2.1 : -2.1;
                return (
                    <Instance 
                        key={`l-${i}`} 
                        position={[v.pos.x, v.pos.y, v.pos.z + offsetZ]} 
                        rotation={new THREE.Euler(v.rot[0], 0, v.side === 'left' ? -0.15 : 0.15)} 
                    />
                )
            })}
          </Instances>
      )}

      {/* --- Pile Cap (Foundation) --- */}
      <mesh position={[8, -5, 0]} material={materials.concrete}>
        <boxGeometry args={[30, 10, 40]} /> 
      </mesh>

      {/* --- Deck Segments --- */}
      <Instances range={300} material={materials.concrete}>
        <boxGeometry args={[2.5, 2, deckWidth]} /> {/* Deck selebar 16 unit */}
        {Array.from({ length: 120 }).map((_, i) => {
            const t = (i / 120) * 2 - 1; 
            const x = t * (spanLength / 2);
            const z = getCurveZ(x);
            
            // Rotasi Y mengikuti tangen kurva
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

                    {/* --- Road Surface & Details --- */}
                    <group position={[x, 0, z]} rotation={[0, -rotY, 0]}>
                        {/* Left Lane */}
                        <mesh position={[0, 4.05, 4]} material={materials.road}>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>
                        {/* Right Lane */}
                        <mesh position={[0, 4.05, -4]} material={materials.road}>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>

                        {/* Median */}
                        <mesh position={[0, 4.2, 0]} material={materials.concrete}>
                            <boxGeometry args={[2.5, 0.4, 1]} />
                        </mesh>
                        {/* Median Light/Pole base */}
                        {i % 8 === 0 && (
                            <mesh position={[0, 4.5, 0]} material={materials.steel}>
                                <boxGeometry args={[0.5, 0.5, 0.5]} />
                            </mesh>
                        )}

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
            <cylinderGeometry args={[0.1, 0.1, len, 4]} />
          </mesh>
        )
      })}

      {/* --- Street Lights (Center Median) --- */}
      <Instances range={60} material={materials.streetLight}>
         <sphereGeometry args={[0.3, 8, 8]} />
         {Array.from({ length: 15 }).map((_, i) => {
             const t = (i / 14) * 2 - 1;
             const x = t * (spanLength / 2);
             if (Math.abs(x) < 15) return null; // Don't put under pylon

             const z = getCurveZ(x);
             
             const k = Math.PI / 2 / (spanLength / 1.8);
             const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
             const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
             const rotY = Math.atan(dzdx);
             
             // Single arm pole on median
             return (
                 <group key={i} position={[x, 4, z]} rotation={[0, -rotY, 0]}>
                     <mesh position={[0, 3, 0]} material={materials.steel}>
                         <cylinderGeometry args={[0.15, 0.2, 6]} />
                     </mesh>
                     <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI/2]} material={materials.steel}>
                         <cylinderGeometry args={[0.1, 0.1, 8]} /> {/* Cross arm for dual lanes */}
                     </mesh>
                     {/* Lights pointing down to both lanes */}
                     <Instance position={[0, 5.8, 3]} />
                     <Instance position={[0, 5.8, -3]} />
                 </group>
             )
         })}
      </Instances>

    </group>
  );
};