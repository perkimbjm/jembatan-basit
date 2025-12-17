
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrafficProps {
  density: number;
  isNight: boolean;
  rainIntensity: number; // 0-100, controls water splash
}

export const Traffic: React.FC<TrafficProps> = ({ density, isNight, rainIntensity }) => {
  // Car body parts
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const windshieldRef = useRef<THREE.InstancedMesh>(null);
  const rearWindowRef = useRef<THREE.InstancedMesh>(null);
  
  // Wheels (4 per car)
  const wheelsRef = useRef<THREE.InstancedMesh>(null);
  const tiresRef = useRef<THREE.InstancedMesh>(null);
  
  // Lights
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const taillightsRef = useRef<THREE.InstancedMesh>(null);
  
  // Effects
  const splashRef = useRef<THREE.InstancedMesh>(null);
  
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
    if (bodyRef.current) {
      cars.forEach((car, i) => {
        bodyRef.current!.setColorAt(i, car.color);
      });
      bodyRef.current.instanceColor!.needsUpdate = true;
    }
  }, [cars]);

  useFrame((state) => {
    if (!bodyRef.current || !wheelsRef.current || !tiresRef.current) return;

    const activeCount = Math.floor((density / 100) * maxCars);

    // Update counts
    bodyRef.current.count = activeCount;
    roofRef.current!.count = activeCount;
    windshieldRef.current!.count = activeCount;
    rearWindowRef.current!.count = activeCount;
    wheelsRef.current.count = activeCount * 4; // 4 wheels per car
    tiresRef.current.count = activeCount * 4;
    headlightsRef.current!.count = activeCount * 2;
    taillightsRef.current!.count = activeCount * 2;

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
      const finalY = baseY + 1.5; // Lower to account for wheels
      
      const carYaw = -rotY + (car.lane === -1 ? Math.PI : 0);
      const carPitch = Math.atan(slope);

      // === CAR BODY (lower part) ===
      dummy.position.set(finalX, finalY, finalZ);
      dummy.rotation.set(0, carYaw, carPitch);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      // === ROOF (upper part) ===
      dummy.position.set(finalX, finalY + 0.5, finalZ);
      dummy.rotation.set(0, carYaw, carPitch);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      roofRef.current!.setMatrixAt(i, dummy.matrix);

      // === WINDSHIELD (front window) ===
      const cosR = Math.cos(carYaw);
      const sinR = Math.sin(carYaw);
      const windshieldOffset = 0.7;
      const windshieldX = finalX + (windshieldOffset * cosR);
      const windshieldZ = finalZ + (-windshieldOffset * sinR);
      
      dummy.position.set(windshieldX, finalY + 0.5, windshieldZ);
      dummy.rotation.set(0, carYaw, carPitch);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      windshieldRef.current!.setMatrixAt(i, dummy.matrix);

      // === REAR WINDOW ===
      const rearWindowX = finalX - (windshieldOffset * cosR);
      const rearWindowZ = finalZ - (-windshieldOffset * sinR);
      
      dummy.position.set(rearWindowX, finalY + 0.5, rearWindowZ);
      dummy.rotation.set(0, carYaw, carPitch);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rearWindowRef.current!.setMatrixAt(i, dummy.matrix);

      // === WHEELS (4 wheels per car) ===
      const wheelPositions = [
        { x: 0.8, z: 0.6 },   // Front left
        { x: 0.8, z: -0.6 },  // Front right
        { x: -0.8, z: 0.6 },  // Rear left
        { x: -0.8, z: -0.6 }, // Rear right
      ];

      wheelPositions.forEach((wheelPos, wheelIdx) => {
        const wheelX = finalX + (wheelPos.x * cosR) - (wheelPos.z * sinR);
        const wheelZ = finalZ + (-wheelPos.x * sinR) - (wheelPos.z * cosR);
        const wheelY = finalY - 0.3;

        // Wheel rim (silver)
        dummy.position.set(wheelX, wheelY, wheelZ);
        dummy.rotation.set(carPitch, carYaw, state.clock.elapsedTime * car.speed * 5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        wheelsRef.current.setMatrixAt(i * 4 + wheelIdx, dummy.matrix);

        // Tire (black, slightly larger)
        dummy.position.set(wheelX, wheelY, wheelZ);
        dummy.rotation.set(carPitch, carYaw, state.clock.elapsedTime * car.speed * 5);
        dummy.scale.set(1.1, 1.1, 1.1);
        dummy.updateMatrix();
        tiresRef.current.setMatrixAt(i * 4 + wheelIdx, dummy.matrix);
      });

      // === HEADLIGHTS ===
      const lFront = 1.2;
      const lWide = 0.5;
      
      const h1x = finalX + (lFront * cosR) - (lWide * sinR);
      const h1z = finalZ + (-lFront * sinR) - (lWide * cosR);
      const h2x = finalX + (lFront * cosR) + (lWide * sinR);
      const h2z = finalZ + (-lFront * sinR) + (lWide * cosR);

      dummy.scale.set(0.15, 0.15, 0.15);
      dummy.rotation.set(0, carYaw, carPitch);

      dummy.position.set(h1x, finalY - 0.1, h1z);
      dummy.updateMatrix();
      headlightsRef.current!.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(h2x, finalY - 0.1, h2z);
      dummy.updateMatrix();
      headlightsRef.current!.setMatrixAt(i * 2 + 1, dummy.matrix);

      // === TAILLIGHTS ===
      const t1x = finalX - (lFront * cosR) - (lWide * sinR);
      const t1z = finalZ - (-lFront * sinR) - (lWide * cosR);
      const t2x = finalX - (lFront * cosR) + (lWide * sinR);
      const t2z = finalZ - (-lFront * sinR) + (lWide * cosR);

      dummy.position.set(t1x, finalY - 0.1, t1z);
      dummy.updateMatrix();
      taillightsRef.current!.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(t2x, finalY - 0.1, t2z);
      dummy.updateMatrix();
      taillightsRef.current!.setMatrixAt(i * 2 + 1, dummy.matrix);
      
      // === WATER SPLASH ===
      if (splashRef.current && rainIntensity > 0) {
        const splashCount = 4;
        for (let j = 0; j < splashCount; j++) {
          const idx = i * splashCount + j;
          const offset = -1.5 - (j * 0.3);
          const splashX = finalX - (offset * cosR);
          const splashZ = finalZ - (-offset * sinR);
          const splashY = finalY - 0.5 + Math.sin(state.clock.elapsedTime * 10 + idx) * 0.2;
          
          dummy.position.set(splashX, splashY, splashZ);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.scale.set(0.3, 0.3, 0.3);
          dummy.updateMatrix();
          splashRef.current.setMatrixAt(idx, dummy.matrix);
        }
      }
    }

    // Update all matrices
    bodyRef.current.instanceMatrix.needsUpdate = true;
    roofRef.current!.instanceMatrix.needsUpdate = true;
    windshieldRef.current!.instanceMatrix.needsUpdate = true;
    rearWindowRef.current!.instanceMatrix.needsUpdate = true;
    wheelsRef.current.instanceMatrix.needsUpdate = true;
    tiresRef.current.instanceMatrix.needsUpdate = true;
    headlightsRef.current!.instanceMatrix.needsUpdate = true;
    taillightsRef.current!.instanceMatrix.needsUpdate = true;
    
    if (splashRef.current) {
      splashRef.current.count = rainIntensity > 0 ? Math.floor((density / 100) * maxCars) * 4 : 0;
      splashRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Car Body (lower part) */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, maxCars]} castShadow>
        <boxGeometry args={[2.4, 0.6, 1.4]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>

      {/* Roof (cabin) */}
      <instancedMesh ref={roofRef} args={[undefined, undefined, maxCars]} castShadow>
        <boxGeometry args={[1.2, 0.5, 1.2]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>

      {/* Windshield (front window) */}
      <instancedMesh ref={windshieldRef} args={[undefined, undefined, maxCars]}>
        <boxGeometry args={[0.1, 0.4, 1.1]} />
        <meshStandardMaterial 
          color="#88ccff"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Rear Window */}
      <instancedMesh ref={rearWindowRef} args={[undefined, undefined, maxCars]}>
        <boxGeometry args={[0.1, 0.4, 1.1]} />
        <meshStandardMaterial 
          color="#88ccff"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Wheel Rims (silver) */}
      <instancedMesh ref={wheelsRef} args={[undefined, undefined, maxCars * 4]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.9} />
      </instancedMesh>

      {/* Tires (black rubber) */}
      <instancedMesh ref={tiresRef} args={[undefined, undefined, maxCars * 4]} castShadow>
        <torusGeometry args={[0.3, 0.12, 8, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
      </instancedMesh>

      {/* Headlights */}
      <instancedMesh ref={headlightsRef} args={[undefined, undefined, maxCars * 2]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={isNight ? 2 : 0.5} 
          toneMapped={false} 
        />
      </instancedMesh>

      {/* Taillights */}
      <instancedMesh ref={taillightsRef} args={[undefined, undefined, maxCars * 2]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
          color="#ff0000" 
          emissive="#ff0000" 
          emissiveIntensity={isNight ? 2 : 0.5} 
          toneMapped={false} 
        />
      </instancedMesh>
      
      {/* Water Splash Particles */}
      <instancedMesh ref={splashRef} args={[undefined, undefined, maxCars * 4]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial 
          color="#aaccff" 
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
};
