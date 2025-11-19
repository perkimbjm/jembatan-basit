
import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SimulationState, BRIDGE_COORDS } from '../types';
import { Bridge } from './Bridge';
import { Water } from './Water';
import { Traffic } from './Traffic';
import { Terrain } from './Terrain';
import { FogParticles } from './FogParticles';
import { Ships } from './Ships';
import maplibregl from 'maplibre-gl';

interface SceneProps {
  state: SimulationState;
  map: maplibregl.Map;
}

export const SceneContainer: React.FC<SceneProps> = ({ state, map }) => {
  const { camera } = useThree();
  const { time, fogDensity, trafficDensity } = state;

  // Calculate Sun Position based on time (0-24)
  const sunPosition = useMemo(() => {
    // 6am = rise, 18pm = set
    const angle = ((time - 12) / 12) * Math.PI;
    const r = 500;
    const x = Math.sin(angle) * r;
    const y = Math.cos(angle) * r;
    return new THREE.Vector3(x, Math.max(y, -50), -100); 
  }, [time]);

  const isNight = time < 6 || time > 18;

  const skyColor = isNight ? '#050510' : '#87CEEB';
  const lightIntensity = isNight ? 0.1 : 1.5;
  const sunColor = isNight ? '#ffaa00' : '#ffffff';

  // Sync Camera with MapLibre
  useFrame(() => {
    if (!map) return;

    // Wrap in try-catch to prevent crash if map is destroyed or not ready
    try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const pitch = map.getPitch();
        const bearing = map.getBearing();

        // Conversions: 1 deg lat ~ 111132m. 
        const METERS_PER_DEG_LAT = 111132;
        const METERS_PER_DEG_LNG = 111319 * Math.cos(BRIDGE_COORDS.lat * (Math.PI / 180));

        const dx = (center.lng - BRIDGE_COORDS.lng) * METERS_PER_DEG_LNG;
        const dz = -(center.lat - BRIDGE_COORDS.lat) * METERS_PER_DEG_LAT; 

        const altitude = 1.5e7 / Math.pow(2, zoom);

        const pitchRad = pitch * (Math.PI / 180);
        const bearingRad = bearing * (Math.PI / 180);

        const groundDist = altitude * Math.tan(pitchRad);

        const offsetX = -groundDist * Math.sin(bearingRad);
        const offsetZ = groundDist * Math.cos(bearingRad);

        camera.position.set(dx + offsetX, altitude, dz + offsetZ);
        camera.lookAt(dx, 0, dz);
        camera.updateMatrixWorld();
    } catch (e) {
        // Map might be disposing, ignore
    }
  });

  return (
    <>
      <ambientLight intensity={isNight ? 0.2 : 0.6} color={skyColor} />
      <directionalLight 
        position={sunPosition} 
        intensity={lightIntensity} 
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-200, 200, 200, -200, 1, 1000]} />
      </directionalLight>
      
      {/* OPTIMIZATION: Reduced Stars count from 5000 to 2000 */}
      {isNight && <Stars radius={300} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}

      {/* Scene Content - Rotated to match Map Geography */}
      <group rotation={[0, -BRIDGE_COORDS.rotation * (Math.PI / 180), 0]}>
        <Bridge isNight={isNight} />
        <Traffic density={trafficDensity} isNight={isNight} />
        <Terrain isNight={isNight} />
        <Ships isNight={isNight} />
      </group>
      
      <Water sunPosition={sunPosition} time={time} />

      <fog attach="fog" args={[skyColor, 100, 2000 / (fogDensity/50 + 0.1)]} />
      {fogDensity > 5 && <FogParticles density={fogDensity} />}

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={isNight ? 0.2 : 1.2}
          mipmapBlur 
          intensity={isNight ? 1.5 : 0.5} 
          radius={0.6}
        />
      </EffectComposer>
    </>
  );
};
