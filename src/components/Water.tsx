import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRIDGE_COLORS } from '../types';

interface WaterProps {
  sunPosition: THREE.Vector3;
  time: number;
}

// Custom GLSL Shader
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPos;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Voxel/Low-poly wave displacement
    float wave1 = sin(pos.x * 0.1 + uTime) * 0.5;
    float wave2 = cos(pos.y * 0.15 + uTime * 0.8) * 0.5;
    
    // Quantize height for voxel feel (stepped waves)
    float h = wave1 + wave2;
    // pos.z += floor(h * 4.0) / 4.0; // Stepped look
    pos.z += h; // Smooth for better reflection look in this context

    vPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPos;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uSunPosition;
  uniform vec3 uCamPosition;

  void main() {
    // Base Water Color
    vec3 color = uColor;
    
    // Normal calculation (derivative trick for flat shading/voxel look if desired, but smooth here)
    vec3 dX = dFdx(vPos);
    vec3 dY = dFdy(vPos);
    vec3 normal = normalize(cross(dX, dY));

    // Specular Reflection (Sun)
    vec3 viewDir = normalize(uCamPosition - vPos);
    vec3 lightDir = normalize(uSunPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    
    // Foam/Highlights
    float foam = sin(vPos.x * 0.5 + uTime) * sin(vPos.y * 0.5 - uTime) > 0.8 ? 0.1 : 0.0;
    
    // Horizon blending (Manual Fog)
    float dist = length(uCamPosition - vPos);
    float fogFactor = 1.0 - exp(-dist * 0.005);
    
    // Combine
    vec3 finalColor = mix(color, vec3(1.0), spec * 0.5 + foam);
    
    // Output
    gl_FragColor = vec4(finalColor, 0.9); // Slight transparency
  }
`;

export const Water: React.FC<WaterProps> = ({ sunPosition, time }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uSunPosition.value = sunPosition;
      materialRef.current.uniforms.uCamPosition.value = state.camera.position;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(BRIDGE_COLORS.water) },
    uSunPosition: { value: new THREE.Vector3() },
    uCamPosition: { value: new THREE.Vector3() }
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[1000, 1000, 100, 100]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
