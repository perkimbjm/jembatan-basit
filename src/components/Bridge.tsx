
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface BridgeProps {
  isNight: boolean;
  wetness: number; // 0-100, controls road reflectivity
}

export const Bridge: React.FC<BridgeProps> = ({ isNight, wetness }) => {
  const spanLength = 220; 
  const pylonHeight = 85; // Increased slightly for new deck height
  const curveIntensity = 50; 
  const deckWidth = 20; 
  const pylonBaseSpacing = 26; 
  const maxElevation = 14; // Max height at center
  const baseElevation = 5; // Height at ends

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
      ctx.fillStyle = '#444444'; // Lighter base
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 100000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#555555' : '#333333';
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

  // Texture for Median Sides (Kerb: Black/White alternating)
  const kerbMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 64);
      // Black Stripes
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, 64, 64); // Half black
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Repeat 2 times along the length of the segment to create alternating blocks
    tex.repeat.set(2, 1); 
    return tex;
  }, []);

  // Texture for Median Top (Grass)
  const grassMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#365c28'; // Base green
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 20000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#4ade80' : '#14532d';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
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
      color: '#666666' // Lighter Gray
    }),
    roadLine: new THREE.MeshBasicMaterial({ 
      color: '#ffffff',
      toneMapped: false // Keep it white even in dim light
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
    }),
    medianSide: new THREE.MeshStandardMaterial({
      map: kerbMap,
      roughness: 0.8
    }),
    medianTop: new THREE.MeshStandardMaterial({
      map: grassMap,
      roughness: 1.0,
      color: '#ffffff'
    })
  }), [concreteMap, asphaltMap, kerbMap, grassMap]);

  // Animate Lights (Chroma Cycle) and Road Wetness
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (isNight) {
      const hue = (time * 0.15) % 1; 
      const color = new THREE.Color().setHSL(hue, 1, 0.6);
      materials.pylon.color.copy(color);
      materials.pylon.emissive.copy(color);
      materials.pylon.emissiveIntensity = 1.5;
      materials.pylon.toneMapped = false;
    } else {
      materials.pylon.color.set('#e0e0e0');
      materials.pylon.emissive.set('#000000');
      materials.pylon.emissiveIntensity = 0;
      materials.pylon.toneMapped = true;
    }
    materials.streetLight.emissiveIntensity = isNight ? 2 : 0;
    
    // Animate road wetness
    const wetnessNormalized = wetness / 100;
    // Wet asphalt is darker, more reflective (lower roughness, higher metalness)
    materials.road.roughness = THREE.MathUtils.lerp(0.9, 0.2, wetnessNormalized);
    materials.road.metalness = THREE.MathUtils.lerp(0, 0.3, wetnessNormalized);
    
    // Darken road when wet
    const dryColor = new THREE.Color('#666666');
    const wetColor = new THREE.Color('#333333');
    materials.road.color.lerpColors(dryColor, wetColor, wetnessNormalized);
  });

  // --- Math Functions for Curves & Elevation ---
  
  // Horizontal S-Curve (XZ Plane)
  const getCurveZ = (x: number) => {
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    return Math.cos(normalized) * curveIntensity - curveIntensity;
  };

  // Vertical Arch (XY Plane) - Elevation
  const getElevation = (x: number) => {
    // Normalize x to -1..1 range based on span
    const normalized = x / (spanLength / 1.9);
    // Cosine wave for smooth hump
    if (Math.abs(normalized) > 1.2) return baseElevation; // Flatten out at ends
    const arch = Math.cos(normalized * (Math.PI / 2));
    return baseElevation + (arch * maxElevation);
  };

  // Calculate Vertical Slope (Pitch)
  const getSlope = (x: number) => {
     const normalized = x / (spanLength / 1.9);
     if (Math.abs(normalized) > 1.2) return 0;
     // Derivative of cos is -sin
     // y = base + max * cos(k*x) -> y' = -max * k * sin(k*x)
     const k = (Math.PI / 2) / (spanLength / 1.9);
     return -maxElevation * k * Math.sin(normalized * (Math.PI / 2));
  };

  const getPylonPos = (h: number, side: 'left' | 'right') => {
      const t = h / pylonHeight; 
      const xBase = 0;
      
      const sideSign = side === 'left' ? 1 : -1;
      const zBase = sideSign * (pylonBaseSpacing / 2);
      const outwardCurve = sideSign * (t * t * 12); 
      const z = zBase + outwardCurve;
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
             const yDeck = getElevation(x); // Attach to elevated deck
             
             [-1, 1].forEach(side => { 
                 const sideName = side === 1 ? 'left' : 'right';
                 const deckZ = zCenter + (side * (deckWidth/2 - 0.5)); 
                 
                 // CORRECTED CABLE LOGIC: 
                 // Left Pylon (sideName='left') connects to Left Side of Deck (side=1)
                 // Right Pylon (sideName='right') connects to Right Side of Deck (side=-1)
                 
                 if ((sideName === 'left' && side === 1) || (sideName === 'right' && side === -1)) {
                    const pylonPoint = getPylonPos(attachH, sideName);
                    // Move pylon attach point slightly inward to match inner face
                    pylonPoint.z += (sideName === 'left' ? -1 : 1);

                    newItems.push({ 
                        start: pylonPoint, 
                        end: new THREE.Vector3(x, yDeck + 1, deckZ), // +1 to attach to railing/side
                    });
                 }
             });
         });
    }
    return newItems;
  }, []);

  return (
    <group>
      {/* --- Solid Pylons --- */}
      <mesh material={materials.pylon} castShadow receiveShadow>
          <tubeGeometry args={[leftCurve, 64, 2.5, 12, false]} />
      </mesh>
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
            const y = getElevation(x);
            
            // Horizontal Rotation (Yaw)
            const k = Math.PI / 2 / (spanLength / 1.8);
            const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
            const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
            const rotY = Math.atan(dzdx);

            // Vertical Rotation (Pitch)
            const slope = getSlope(x);
            const rotZ = Math.atan(slope);

            const isJoint = i % 10 === 0 && i !== 0 && i !== 120;

            return (
                <group key={i} position={[x, y, z]} rotation={[0, -rotY, rotZ]}>
                    
                    {/* Concrete Base */}
                    {!isJoint && <Instance />}
                    
                    {/* Expansion Joint */}
                    {isJoint && (
                        <mesh position={[0, 0.1, 0]} material={materials.joint}>
                            <boxGeometry args={[0.4, 1.9, deckWidth - 0.2]} />
                        </mesh>
                    )}

                    {/* --- Surface & Details --- */}
                    <group position={[0, -3, 0]}> {/* Local offset to align top of box with y */}
                        {/* Left Road Lane */}
                        <mesh position={[0, 4.05, 4]} material={materials.road} receiveShadow>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>
                        {/* Right Road Lane */}
                        <mesh position={[0, 4.05, -4]} material={materials.road} receiveShadow>
                            <boxGeometry args={[2.5, 0.1, 7]} />
                        </mesh>

                        {/* Dashed Road Markings (Divide each 7-unit lane into two) */}
                        {/* Draw every other segment for dashed effect */}
                        {i % 2 === 0 && (
                          <>
                            {/* Left Lane Marking (Center at z=4) */}
                            <mesh position={[0, 4.11, 4]} rotation={[-Math.PI/2, 0, 0]}>
                                <planeGeometry args={[1.5, 0.15]} />
                                <primitive object={materials.roadLine} attach="material" />
                            </mesh>
                            {/* Right Lane Marking (Center at z=-4) */}
                            <mesh position={[0, 4.11, -4]} rotation={[-Math.PI/2, 0, 0]}>
                                <planeGeometry args={[1.5, 0.15]} />
                                <primitive object={materials.roadLine} attach="material" />
                            </mesh>
                          </>
                        )}

                        {/* Median with specific materials (Kerb sides, Green top) */}
                        <mesh position={[0, 4.2, 0]}>
                            <boxGeometry args={[2.5, 0.4, 1]} />
                            {/* Array of materials: Right, Left, Top, Bottom, Front, Back */}
                            <primitive object={materials.medianSide} attach="material-0" />
                            <primitive object={materials.medianSide} attach="material-1" />
                            <primitive object={materials.medianTop} attach="material-2" />
                            <primitive object={materials.concrete} attach="material-3" />
                            <primitive object={materials.concrete} attach="material-4" />
                            <primitive object={materials.concrete} attach="material-5" />
                        </mesh>

                        {/* Sidewalk Left */}
                        <mesh position={[0, 4.2, 8.5]} material={materials.sidewalk} receiveShadow>
                             <boxGeometry args={[2.5, 0.3, 2]} /> 
                        </mesh>
                        {/* Sidewalk Right */}
                        <mesh position={[0, 4.2, -8.5]} material={materials.sidewalk} receiveShadow>
                             <boxGeometry args={[2.5, 0.3, 2]} />
                        </mesh>

                        {/* === OUTER RAILINGS (Edge of bridge) === */}
                        {/* Left Outer */}
                        <mesh position={[0, 4.5, deckWidth/2 - 0.5]} material={materials.steel}>
                            <boxGeometry args={[0.2, 1.2, 0.2]} />
                        </mesh>
                         <mesh position={[0, 4.8, deckWidth/2 - 0.5]} material={materials.redAccent}>
                            <boxGeometry args={[2.6, 0.1, 0.1]} />
                        </mesh>
                        
                        {/* Right Outer */}
                        <mesh position={[0, 4.5, -deckWidth/2 + 0.5]} material={materials.steel}>
                            <boxGeometry args={[0.2, 1.2, 0.2]} />
                        </mesh>
                        <mesh position={[0, 4.8, -deckWidth/2 + 0.5]} material={materials.redAccent}>
                            <boxGeometry args={[2.6, 0.1, 0.1]} />
                        </mesh>

                        {/* === INNER RAILINGS (Separating Pedestrian from Road) === */}
                        {/* Left Inner (approx z = 7.4) */}
                        <mesh position={[0, 4.5, 7.4]} material={materials.steel}>
                            <boxGeometry args={[0.15, 1.1, 0.15]} />
                        </mesh>
                        <mesh position={[0, 4.8, 7.4]} material={materials.redAccent}>
                             <boxGeometry args={[2.6, 0.1, 0.1]} />
                        </mesh>

                        {/* Right Inner (approx z = -7.4) */}
                        <mesh position={[0, 4.5, -7.4]} material={materials.steel}>
                            <boxGeometry args={[0.15, 1.1, 0.15]} />
                        </mesh>
                        <mesh position={[0, 4.8, -7.4]} material={materials.redAccent}>
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
             const y = getElevation(x); // Follow elevation
             
             // Yaw
             const k = Math.PI / 2 / (spanLength / 1.8);
             const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
             const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
             const rotY = Math.atan(dzdx);

             // Pitch
             const slope = getSlope(x);
             const rotZ = Math.atan(slope);
             
             return (
                 <group key={i} position={[x, y + 1, z]} rotation={[0, -rotY, rotZ]}>
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
