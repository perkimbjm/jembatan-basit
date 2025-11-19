
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrafficProps {
  density: number;
  isNight: boolean;
}

export const Traffic: React.FC<TrafficProps> = ({ density, isNight }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const taillightsRef = useRef<THREE.InstancedMesh>(null);
  
  const maxCars = 300;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Matched to Bridge.tsx params
  const spanLength = 220;
  const curveIntensity = 50;
  const maxElevation = 14;
  const baseElevation = 5;
  
  // Horizontal Curve
  const getCurveZ = (x: number) => {
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    return Math.cos(normalized) * curveIntensity - curveIntensity;
  };

  // Vertical Elevation
  const getElevation = (x: number) => {
    const normalized = x / (spanLength / 1.9);
    if (Math.abs(normalized) > 1.2) return baseElevation; 
    const arch = Math.cos(normalized * (Math.PI / 2));
    return baseElevation + (arch * maxElevation);
  };

  // Yaw Rotation
  const getRotationY = (x: number) => {
     const k = Math.PI / 2 / (spanLength / 1.8);
     const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
     const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
     return Math.atan(dzdx);
  }

  // Pitch Rotation
  const getSlope = (x: number) => {
    const normalized = x / (spanLength / 1.9);
    if (Math.abs(normalized) > 1.2) return 0;
    const k = (Math.PI / 2) / (spanLength / 1.9);
    return -maxElevation * k * Math.sin(normalized * (Math.PI / 2));
 };

  // Initialize car data
  const cars = useMemo(() => {
    return new Array(maxCars).fill(0).map(() => ({
      x: (Math.random() - 0.5) * (spanLength + 60),
      speed: Math.random() * 0.25 + 0.15,
      lane: Math.random() > 0.5 ? 1 : -1, 
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
    }));
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      cars.forEach((car, i) => {
        meshRef.current!.setColorAt(i, car.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [cars]);

  useFrame((state) => {
    if (!meshRef.current || !headlightsRef.current || !taillightsRef.current) return;

    const activeCount = Math.floor((density / 100) * maxCars);

    meshRef.current.count = activeCount;
    headlightsRef.current.count = activeCount;
    taillightsRef.current.count = activeCount;

    for (let i = 0; i < activeCount; i++) {
      const car = cars[i];
      
      // Move car
      car.x += car.speed * car.lane; 
      
      // Loop logic
      const bound = (spanLength / 2) + 40;
      if (car.x > bound) car.x = -bound;
      if (car.x < -bound) car.x = bound;

      // Calculate Position
      const baseZ = getCurveZ(car.x);
      const baseY = getElevation(car.x);
      
      const rotY = getRotationY(car.x);
      const slope = getSlope(car.x);
      
      const laneOffset = car.lane === 1 ? -4 : 4;
      
      const finalX = car.x - (Math.sin(rotY) * laneOffset);
      const finalZ = baseZ + (Math.cos(rotY) * laneOffset);
      const finalY = baseY + 1.8; // 1.8 sits on top of deck surface

      // Car Body
      dummy.position.set(finalX, finalY, finalZ);
      
      const carYaw = -rotY + (car.lane === -1 ? Math.PI : 0);
      const carPitch = (car.lane === 1) ? Math.atan(slope) : -Math.atan(slope); // Invert pitch if driving backwards? No, slope is purely geometric.
      // Actually: if moving -X, and slope is positive (uphill for +X), it's downhill for -X.
      // But slope returns dy/dx. 
      // If driving +X (Left to Right), slope > 0 means nose up.
      // If driving -X (Right to Left), slope > 0 means tail up (nose down).
      
      // ThreeJS rotation order default is XYZ.
      // We need to rotate Y for direction, then Z for slope.
      // Actually let's just use Z rotation derived from slope.
      // Slope is dY/dX.
      // RotZ = atan(slope).
      
      dummy.rotation.set(0, carYaw, Math.atan(slope)); 
      
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Headlights / Taillights Logic
      const lFront = 1.1;
      const lWide = 0.6;
      const cosR = Math.cos(carYaw);
      const sinR = Math.sin(carYaw);
      
      // We assume flat projection for lights relative to car center for simplicity, 
      // but correctly they should follow the pitch. 
      // Since dummy matrix handles rotation, we can just use local offsets if we nested them,
      // but here we are setting world matrices. 
      // Simplification: Just position lights relative to final X/Z and same Y, relying on small size.
      // Better: Apply rotation to light offsets.
      
      // Simple offset approximation ignoring pitch for lights placement (barely noticeable)
      const h1x = finalX + (lFront * cosR) - (lWide * sinR);
      const h1z = finalZ + (-lFront * sinR) - (lWide * cosR);
      const h2x = finalX + (lFront * cosR) + (lWide * sinR);
      const h2z = finalZ + (-lFront * sinR) + (lWide * cosR);

      const t1x = finalX - (lFront * cosR) - (lWide * sinR);
      const t1z = finalZ - (-lFront * sinR) - (lWide * cosR);
      const t2x = finalX - (lFront * cosR) + (lWide * sinR);
      const t2z = finalZ - (-lFront * sinR) + (lWide * cosR);

      // Headlights
      dummy.scale.set(0.2, 0.2, 0.2);
      // Reuse rotation
      dummy.rotation.set(0, carYaw, Math.atan(slope));

      dummy.position.set(h1x, finalY, h1z);
      dummy.updateMatrix();
      headlightsRef.current.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(h2x, finalY, h2z);
      dummy.updateMatrix();
      headlightsRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);

      // Taillights
      dummy.position.set(t1x, finalY, t1z);
      dummy.updateMatrix();
      taillightsRef.current.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(t2x, finalY, t2z);
      dummy.updateMatrix();
      taillightsRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    headlightsRef.current.instanceMatrix.needsUpdate = true;
    taillightsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, maxCars]} castShadow>
        <boxGeometry args={[2.2, 0.8, 1.4]} />
        <meshStandardMaterial roughness={0.3} metalness={0.6} />
      </instancedMesh>

      <instancedMesh ref={headlightsRef} args={[undefined, undefined, maxCars * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={isNight ? 2 : 0.5} 
          toneMapped={false} 
        />
      </instancedMesh>

      <instancedMesh ref={taillightsRef} args={[undefined, undefined, maxCars * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#ff0000" 
          emissive="#ff0000" 
          emissiveIntensity={isNight ? 2 : 0.5} 
          toneMapped={false} 
        />
      </instancedMesh>
    </group>
  );
};
