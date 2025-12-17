import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { SimulationState } from '../types';
import { Bridge } from './Bridge';
import { Water } from './Water';
import { Traffic } from './Traffic';
import { Terrain } from './Terrain';
import { FogParticles } from './FogParticles';
import { Rain } from './Rain';
import { HeatHaze } from './HeatHaze';
import { Ships } from './Ships';
import { DynamicClouds } from './DynamicClouds';
import { FirstPersonCamera } from './FirstPersonCamera';

interface SceneProps {
  state: SimulationState;
}

export const SceneContainer: React.FC<SceneProps> = ({ state }) => {
  const { scene } = useThree();
  
  // Calculate sun position based on time (0-24)
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

  // Calculate rain and heat intensities from weather value
  // Rain can also be triggered by high fog density (>80%)
  const weatherRain = state.weather < 0 ? Math.abs(state.weather) : 0;
  const fogRain = state.fogDensity > 80 ? (state.fogDensity - 80) * 5 : 0; // 0-100 when fog is 80-100%
  const rainIntensity = Math.max(weatherRain, fogRain); // Use the higher of the two
  const heatIntensity = state.weather > 0 ? state.weather : 0;

  // Update fog and background
  useFrame(() => {
    let fogColor = isNight ? new THREE.Color('#050510') : new THREE.Color('#dcebf5');
    
    // Darken sky when raining
    if (rainIntensity > 0) {
      fogColor.lerp(new THREE.Color('#6b7280'), rainIntensity / 200);
    }
    
    // Warm up sky when hot
    if (heatIntensity > 0) {
      fogColor.lerp(new THREE.Color('#fef3c7'), heatIntensity / 300);
    }
    
    // Blend fog color based on time for sunset/sunrise
    if (state.time > 17 && state.time < 20) fogColor.lerp(new THREE.Color('#fdba74'), 0.5);
    if (state.time > 4 && state.time < 7) fogColor.lerp(new THREE.Color('#fdba74'), 0.5);
    
    scene.background = fogColor;
    
    // Update fog density
    const density = state.fogDensity / 100;
    const fogNear = 20 * (1.1 - density);
    const fogFar = 300 * (1.1 - density) + 50;
    
    // We use standard fog for distance and particle fog for volume
    scene.fog = new THREE.Fog(fogColor, Math.max(0, fogNear), Math.max(50, fogFar));
  });

  return (
    <>
      {/* Camera Controls */}
      {state.cameraMode === 'orbit' && (
        <OrbitControls 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          maxDistance={200}
          minDistance={10}
        />
      )}
      <FirstPersonCamera enabled={state.cameraMode === 'firstPerson'} />

      {/* Lighting */}
      <ambientLight intensity={isNight ? 0.05 : 0.4} color={isNight ? "#3333ff" : "#ffffff"} />
      <directionalLight
        position={sunPosition}
        intensity={lightIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
      </directionalLight>

      {/* Environment */}
      {!isNight && (
        <Sky 
          sunPosition={sunPosition} 
          turbidity={10} 
          rayleigh={state.fogDensity > 50 ? 2 : 0.5} 
          mieCoefficient={0.005} 
          mieDirectionalG={0.8} 
        />
      )}
      
      {/* Dynamic Clouds */}
      <DynamicClouds time={state.time} weather={state.weather} />
      
      {isNight && <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

      {/* World Components */}
      <group>
        <Bridge isNight={isNight} wetness={rainIntensity} />
        <Traffic density={state.trafficDensity} isNight={isNight} rainIntensity={rainIntensity} />
        <Water sunPosition={sunPosition} time={state.time} />
        <Terrain />
        <Ships isNight={isNight} />
        <FogParticles density={state.fogDensity} />
        
        {/* Weather Effects */}
        {rainIntensity > 0 && <Rain intensity={rainIntensity} />}
        {heatIntensity > 0 && <HeatHaze intensity={heatIntensity} />}
      </group>

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={isNight ? 0.3 : 0.98} 
          mipmapBlur 
          intensity={isNight ? 1.5 : 0.5} 
          radius={0.6}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
};