import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { SimulationState, BRIDGE_COORDS } from '../types';
import { Bridge } from './Bridge';
import { Water } from './Water';
import { Traffic } from './Traffic';
import { Terrain } from './Terrain';
import { FogParticles } from './FogParticles';
import { Ships } from './Ships';
import type { Map } from 'maplibre-gl';

interface SceneProps {
  state: SimulationState;
  map: Map;
}

export const SceneContainer: React.FC<SceneProps> = ({ state, map }) => {
  const { camera, scene } = useThree();
  
  // --- GIS Synchronization Logic ---
  useFrame(() => {
    if (!map) return;

    // 1. Sync Position
    // We treat the Bridge Center as World (0,0,0) in Three.js
    // We need to calculate where the camera is relative to that point in meters
    
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();

    // Meters per degree (approximate at equator/latitude)
    const LAT = BRIDGE_COORDS.lat;
    const METERS_PER_LAT_DEGREE = 111320;
    const METERS_PER_LNG_DEGREE = 111320 * Math.cos(LAT * Math.PI / 180);

    // Calculate offset in meters from the bridge center
    const deltaLng = center.lng - BRIDGE_COORDS.lng;
    const deltaLat = center.lat - BRIDGE_COORDS.lat;

    const x = deltaLng * METERS_PER_LNG_DEGREE;
    const z = -(deltaLat * METERS_PER_LAT_DEGREE); // Z is inverted in 3D vs Latitude

    // Calculate Altitude
    // MapLibre altitude formula approximation
    // At zoom 0, world is 512px. At zoom N, world is 512 * 2^N.
    // We use a simpler scalar for visual fit or map.transform.height if accessible (hard in React)
    // Standard Web Mercator scale factor
    const scale = Math.pow(2, zoom);
    // Adjust this factor to match the visual scale of your voxels (1 unit = 1 meter approx)
    const altitude = 120000000 / scale; // Empirical tuning for visual match
    
    // Refined altitude calculation based on pitch to keep center in view
    // When pitching, the camera moves back and down physically in MapLibre logic
    // But here we just place the camera at the "center" lat/lng and move up
    // We need to back the camera up based on pitch to look at the center
    
    const distance = altitude / Math.cos(THREE.MathUtils.degToRad(pitch));

    // Set Camera Position
    // We are at (x,0,z) (The map center on the ground). We go up by altitude.
    // Actually, MapLibre camera is "distance" away from center.
    camera.position.set(x, altitude, z);
    
    // Apply Rotations
    // Reset
    camera.rotation.set(0, 0, 0);
    
    // Order: Y (Bearing) -> X (Pitch)
    camera.rotation.order = 'YXZ';
    
    // Bearing (MapLibre 0 = North, Three.js looking -Z is North? Let's align)
    // If Bridge is at 0,0,0. MapLibre bearing rotates the world CW. Camera rotates CCW.
    // 0 bearing = Looking North (Negative Z).
    camera.rotation.y = THREE.MathUtils.degToRad(180 + bearing); // +180 to align North with -Z? Tuning required.
    // Pitch (0 = Top down, 60 = Angled)
    camera.rotation.x = THREE.MathUtils.degToRad(-90 + pitch);

    // FOV Sync (MapLibre default is roughly 36.8 deg vertically? usually wider)
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
  });

  // --- Environment & Lighting ---

  const sunPosition = useMemo(() => {
    const theta = Math.PI * (state.time / 12 - 0.5);
    const phi = Math.PI * (state.time / 24 - 0.5);
    const x = Math.cos(phi) * Math.sin(theta) * 100;
    const y = Math.sin(phi) * 100;
    const z = Math.cos(phi) * Math.cos(theta) * 100;
    return new THREE.Vector3(x, Math.max(y, -10), z);
  }, [state.time]);

  const isNight = state.time > 19 || state.time < 5;
  const lightIntensity = isNight ? 0.1 : 1.5;

  // Scene Background is transparent to show map
  scene.background = null; 

  // Note: We removed Scene.fog because it conflicts with the map visibility
  // We use the FogParticles for atmosphere instead

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isNight ? 0.2 : 0.6} color={isNight ? "#3333ff" : "#ffffff"} />
      <directionalLight
        position={sunPosition}
        intensity={lightIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-200, 200, 200, -200]} />
      </directionalLight>

      {/* Sky (Only at horizon, or disable to show map style) */}
      {/* We disable Sky to let the MapLibre style (Dark Matter) be the background */}
      
      {isNight && <Stars radius={300} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}

      {/* World Components Group - Rotated to match real world bridge orientation */}
      <group rotation={[0, THREE.MathUtils.degToRad(BRIDGE_COORDS.rotation), 0]}>
        <Bridge isNight={isNight} />
        <Traffic density={state.trafficDensity} isNight={isNight} />
        <Water sunPosition={sunPosition} time={state.time} />
        {/* Terrain is optional, can overlap map. Let's keep it as Voxel Style overlay */}
        <Terrain />
        <Ships isNight={isNight} />
        <FogParticles density={state.fogDensity} />
      </group>

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={isNight ? 0.4 : 0.98} 
          mipmapBlur 
          intensity={isNight ? 1.2 : 0.5} 
          radius={0.6}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
};