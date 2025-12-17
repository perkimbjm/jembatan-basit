import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds } from '@react-three/drei';
import * as THREE from 'three';

interface DynamicCloudsProps {
  time: number; // 0-24 hour format
  weather: number; // negative = rain, positive = heat
}

export const DynamicClouds: React.FC<DynamicCloudsProps> = ({ time, weather }) => {
  const cloudsRef = useRef<THREE.Group>(null);
  
  // Determine if it's night time
  const isNight = time > 19 || time < 5;
  
  // Calculate cloud color based on time of day
  const cloudColor = useMemo(() => {
    if (isNight) {
      return '#1e293b'; // Dark blue-gray at night
    }
    
    // Sunrise (5-7)
    if (time >= 5 && time < 7) {
      const t = (time - 5) / 2;
      return new THREE.Color('#fdba74').lerp(new THREE.Color('#ffffff'), t).getHexString();
    }
    
    // Sunset (17-19)
    if (time >= 17 && time < 19) {
      const t = (time - 17) / 2;
      return new THREE.Color('#ffffff').lerp(new THREE.Color('#f97316'), t).getHexString();
    }
    
    // Rainy weather - darker clouds
    if (weather < 0) {
      const rainIntensity = Math.min(Math.abs(weather) / 100, 1);
      return new THREE.Color('#ffffff').lerp(new THREE.Color('#6b7280'), rainIntensity).getHexString();
    }
    
    // Normal daytime
    return '#ffffff';
  }, [time, weather, isNight]);

  // Cloud opacity based on weather - kept light to avoid fogging the bridge
  const cloudOpacity = useMemo(() => {
    if (isNight) return 0.15;
    if (weather < 0) return 0.5; // More opaque during rain but still light
    if (weather > 50) return 0.2; // Less clouds during heat
    return 0.35; // Default - light and wispy
  }, [weather, isNight]);

  // Generate cloud positions - placed high and far from bridge
  const cloudData = useMemo(() => {
    const clouds = [];
    const cloudCount = weather < 0 ? 12 : 8; // Fewer clouds for cleaner look
    
    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const radius = 150 + Math.random() * 100; // Further from center
      clouds.push({
        position: [
          Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
          80 + Math.random() * 40, // Higher altitude (80-120)
          Math.sin(angle) * radius + (Math.random() - 0.5) * 30
        ] as [number, number, number],
        scale: 10 + Math.random() * 15, // Smaller clouds
        speed: 0.05 + Math.random() * 0.1, // Slower movement
        segments: 10 + Math.floor(Math.random() * 10), // Less dense
        volume: 1 + Math.random() * 2, // Thinner
        growth: 1 + Math.random() * 2,
        fade: 20 + Math.random() * 30, // More fade for wispy look
      });
    }
    
    return clouds;
  }, [weather]);

  // Animate cloud movement
  useFrame((state) => {
    if (cloudsRef.current) {
      const elapsed = state.clock.getElapsedTime();
      // Slow rotation to simulate wind
      cloudsRef.current.rotation.y = elapsed * 0.005;
    }
  });

  // Don't render clouds at night (stars are shown instead)
  if (isNight) return null;

  return (
    <group ref={cloudsRef}>
      <Clouds material={THREE.MeshBasicMaterial}>
        {cloudData.map((cloud, i) => (
          <Cloud
            key={i}
            position={cloud.position}
            speed={cloud.speed}
            opacity={cloudOpacity}
            segments={cloud.segments}
            bounds={[cloud.scale, cloud.volume, cloud.scale]}
            volume={cloud.volume}
            color={cloudColor}
            growth={cloud.growth}
            fade={cloud.fade}
          />
        ))}
      </Clouds>
    </group>
  );
};
