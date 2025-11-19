
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
  
  // OPTIMIZATION: Reduced from 300 to 150
  const maxCars = 150;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Curve logic copied from Bridge to keep cars on road
  const spanLength = 160;
  const curveIntensity = 35;
  
  const getCurveZ = (x: number) => {
    const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
    return Math.cos(normalized) * curveIntensity - curveIntensity;
  };

  const getRotationY = (x: number) => {
     const k = Math.PI / 2 / (spanLength / 1.8);
     const normalizedX = (x / (spanLength / 1.8)) * (Math.PI / 2);
     const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
     return Math.atan(dzdx);
  }

  // Initialize car data
  const cars = useMemo(() => {
    return new Array(maxCars).fill(0).map(() => ({
      x: (Math.random() - 0.5) * (spanLength + 40),
      speed: Math.random() * 0.2 + 0.15,
      lane: Math.random() > 0.5 ? 1 : -1, // 1 = forward (right lane), -1 = backward (left lane)
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
      const bound = (spanLength / 2) + 20;
      if (car.x > bound) car.x = -bound;
      if (car.x < -bound) car.x = bound;

      // Calculate Curve Position
      const baseZ = getCurveZ(car.x);
      const rotY = getRotationY(car.x);
      
      // Offset from center line based on lane
      // If lane 1, we are on right side of road relative to forward direction
      // We need to offset perpendicular to the curve tangent
      const laneOffset = car.lane === 1 ? 3 : -3;
      
      const offsetX = Math.sin(rotY) * laneOffset;
      const offsetZ = Math.cos(rotY) * laneOffset;

      const x = car.x + offsetX;
      const z = baseZ + offsetZ; 
      
      const finalX = car.x - (Math.sin(rotY) * laneOffset);
      const finalZ = baseZ + (Math.cos(rotY) * laneOffset);

      const y = 4.8; 

      // Car Body
      dummy.position.set(finalX, y, finalZ);
      // Rotate car to follow road curve
      const carRot = -rotY + (car.lane === -1 ? Math.PI : 0);
      dummy.rotation.set(0, carRot, 0);
      
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Headlights
      const lFront = 1.1;
      const lWide = 0.6;
      
      const cosR = Math.cos(carRot);
      const sinR = Math.sin(carRot);
      
      // Front Left
      const h1x = finalX + (lFront * cosR) - (lWide * sinR);
      const h1z = finalZ + (-lFront * sinR) - (lWide * cosR);
      
      // Front Right
      const h2x = finalX + (lFront * cosR) + (lWide * sinR);
      const h2z = finalZ + (-lFront * sinR) + (lWide * cosR);

      // Rear Left
      const t1x = finalX - (lFront * cosR) - (lWide * sinR);
      const t1z = finalZ - (-lFront * sinR) - (lWide * cosR);
      
      // Rear Right
      const t2x = finalX - (lFront * cosR) + (lWide * sinR);
      const t2z = finalZ - (-lFront * sinR) + (lWide * cosR);

      // Apply Headlights
      dummy.scale.set(0.2, 0.2, 0.2);
      dummy.rotation.set(0, carRot, 0);

      dummy.position.set(h1x, y, h1z);
      dummy.updateMatrix();
      headlightsRef.current.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(h2x, y, h2z);
      dummy.updateMatrix();
      headlightsRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);

      // Apply Taillights
      dummy.position.set(t1x, y, t1z);
      dummy.updateMatrix();
      taillightsRef.current.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(t2x, y, t2z);
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
