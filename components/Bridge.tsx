import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface BridgeProps {
  isNight: boolean;
}

export const Bridge: React.FC<BridgeProps> = ({ isNight }) => {
  // Jembatan Alalak Dimensions
  const spanLength = 160;
  const pylonHeight = 45;
  const curveIntensity = 35; // How much the bridge curves in Z axis

  // Calculate curve position based on X
  const getCurveZ = (x: number) => {
    // Parabolic curve or Cosine curve to simulate the bend
    // Normalize x from -spanLength/2 to spanLength/2 to -PI/2 to PI/2
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    return Math.cos(normalized) * curveIntensity - curveIntensity; // Curve outwards
  };

  // Generate Cable Data (Fan type)
  const cables = useMemo(() => {
    const items = [];
    const cableCount = 16; // Cables per side per pylon face
    const startX = 10; // Distance from pylon center where cables start attached to deck
    const endX = spanLength / 2 - 5;

    for (let i = 0; i < cableCount; i++) {
      const t = i / (cableCount - 1);
      const xDist = startX + (endX - startX) * t;
      
      // Generate for both sides (+x and -x)
      [-1, 1].forEach(dir => {
        const xDeck = xDist * dir;
        const zDeckBase = getCurveZ(xDeck);
        
        // Cables attach to the edges of the deck
        const zOffset = 6; // Width from center
        
        // Cable geometry: Line from Pylon Top to Deck Edge
        // Pylon Top approx position
        const pylonTop = { x: 0, y: pylonHeight - 5, z: -curveIntensity }; 
        
        // Deck attachment point
        const deckPoint = { x: xDeck, y: 4, z: zDeckBase + zOffset };
        const deckPointInner = { x: xDeck, y: 4, z: zDeckBase - zOffset };

        // Calculate length and angle for the box representing the cable
        const dist = Math.sqrt(
          Math.pow(pylonTop.x - deckPoint.x, 2) +
          Math.pow(pylonTop.y - deckPoint.y, 2) +
          Math.pow(pylonTop.z - deckPoint.z, 2)
        );
        
        // We store start and end points to compute transform in the instance loop or simplified representation
        items.push({ 
          start: pylonTop, 
          end: deckPoint, 
          dist 
        });
        items.push({ 
            start: pylonTop, 
            end: deckPointInner, 
            dist 
        });
      });
    }
    return items;
  }, []);

  const materials = useMemo(() => ({
    concrete: new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5 }), // Lighter concrete for Alalak
    road: new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.8 }),
    cable: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), // White cables
    redAccent: new THREE.MeshStandardMaterial({ color: '#D81B1B', roughness: 0.6 }),
    light: new THREE.MeshStandardMaterial({ 
      color: '#ff00ff', // Colorful RGB lights often seen on Basit bridge
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
  }), [isNight]);

  return (
    <group position={[0, 0, 0]}>
      
      {/* --- Main Pylon (The "Needle" / Curved Pylon) --- */}
      {/* Jembatan Basit has a unique curved pylon structure */}
      <group position={[0, 0, -curveIntensity]}>
        {/* Base */}
        <mesh position={[0, -5, 0]} material={materials.concrete}>
          <cylinderGeometry args={[8, 10, 20, 8]} />
        </mesh>
        
        {/* Tower Main Shaft */}
        <mesh position={[0, pylonHeight / 2, 0]} material={materials.concrete}>
          <boxGeometry args={[6, pylonHeight, 8]} />
        </mesh>

        {/* Red Accent Top */}
        <mesh position={[0, pylonHeight + 2, 0]} material={materials.redAccent}>
          <boxGeometry args={[5, 4, 7]} />
        </mesh>

        {/* Decorative RGB Lights on Pylon */}
        {isNight && (
          <mesh position={[0, pylonHeight/2, 4.1]} material={materials.light}>
             <planeGeometry args={[2, pylonHeight - 10]} />
          </mesh>
        )}
      </group>

      {/* --- Deck & Railings (Segmented for Curve) --- */}
      <Instances range={100} material={materials.concrete}>
        <boxGeometry args={[2.2, 1, 14]} /> {/* Deck segment */}
        {Array.from({ length: 80 }).map((_, i) => {
           // Map -1 to 1 normalized
           const t = (i / 80) * 2 - 1; 
           const x = t * (spanLength / 2);
           const z = getCurveZ(x);
           
           // Calculate rotation (tangent to curve)
           // Derivative of cos(kx) is -k*sin(kx)
           const k = Math.PI / 2 / (spanLength / 1.8);
           const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
           const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
           const rotY = Math.atan(dzdx);

           return (
             <group key={i}>
                <Instance position={[x, 4, z]} rotation={[0, -rotY, 0]} />
                
                {/* Railings (Red) */}
                <mesh position={[x, 5, z + 6.5]} rotation={[0, -rotY, 0]} material={materials.redAccent}>
                   <boxGeometry args={[2.2, 0.5, 0.5]} />
                </mesh>
                <mesh position={[x, 5, z - 6.5]} rotation={[0, -rotY, 0]} material={materials.redAccent}>
                   <boxGeometry args={[2.2, 0.5, 0.5]} />
                </mesh>

                {/* Road Surface */}
                <mesh position={[x, 4.6, z]} rotation={[0, -rotY, 0]} material={materials.road}>
                   <boxGeometry args={[2.2, 0.1, 12]} />
                </mesh>
             </group>
           )
        })}
      </Instances>

      {/* --- Cables --- */}
      {/* We draw thin boxes connecting points */}
      {cables.map((c, i) => {
        const midX = (c.start.x + c.end.x) / 2;
        const midY = (c.start.y + c.end.y) / 2;
        const midZ = (c.start.z + c.end.z) / 2;
        
        // LookAt logic for box
        const vec = new THREE.Vector3(c.end.x - c.start.x, c.end.y - c.start.y, c.end.z - c.start.z);
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, vec.clone().normalize());
        const rotation = new THREE.Euler().setFromQuaternion(quaternion);

        return (
          <mesh 
            key={`cab-${i}`} 
            position={[midX, midY, midZ]} 
            rotation={rotation}
            material={materials.cable}
          >
            <boxGeometry args={[0.15, c.dist, 0.15]} />
          </mesh>
        )
      })}

      {/* --- Street Lights --- */}
      <Instances range={30} material={materials.streetLight}>
        <sphereGeometry args={[0.4, 8, 8]} />
        {Array.from({ length: 16 }).map((_, i) => {
           const t = (i / 15) * 2 - 1;
           const x = t * (spanLength / 2);
           const z = getCurveZ(x);
           
           const k = Math.PI / 2 / (spanLength / 1.8);
           const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
           const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
           const rotY = Math.atan(dzdx);

           // Only place lights if not too close to pylon
           if (Math.abs(x) < 10) return null;

           // Calculate offset perpendicular to curve for light posts
           const offsetX = Math.sin(rotY) * 7;
           const offsetZ = Math.cos(rotY) * 7;

           return (
             <React.Fragment key={i}>
               <Instance position={[x - offsetX, 10, z + offsetZ]} />
               <Instance position={[x + offsetX, 10, z - offsetZ]} />
               
               {/* Poles */}
               <mesh position={[x - offsetX, 7, z + offsetZ]} material={materials.concrete}>
                 <cylinderGeometry args={[0.1, 0.1, 6]} />
               </mesh>
               <mesh position={[x + offsetX, 7, z - offsetZ]} material={materials.concrete}>
                 <cylinderGeometry args={[0.1, 0.1, 6]} />
               </mesh>
             </React.Fragment>
           )
        })}
      </Instances>
    </group>
  );
};