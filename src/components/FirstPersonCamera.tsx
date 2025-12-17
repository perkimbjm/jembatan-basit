import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FirstPersonCameraProps {
  enabled: boolean;
  speed?: number; // Speed multiplier
}

// Bridge curve functions (must match Bridge.tsx)
const getCurveZ = (x: number) => {
  const spanLength = 220;
  const curveIntensity = 50;
  const normalized = (x / (spanLength / 1.8)) * (Math.PI / 2);
  return Math.cos(normalized) * curveIntensity - curveIntensity;
};

const getElevation = (x: number) => {
  const spanLength = 220;
  const maxElevation = 14;
  const baseElevation = 5;
  const normalized = x / (spanLength / 1.9);
  if (Math.abs(normalized) > 1.2) return baseElevation;
  const arch = Math.cos(normalized * (Math.PI / 2));
  return baseElevation + (arch * maxElevation);
};

const getSlope = (x: number) => {
  const spanLength = 220;
  const maxElevation = 14;
  const normalized = x / (spanLength / 1.9);
  if (Math.abs(normalized) > 1.2) return 0;
  const k = (Math.PI / 2) / (spanLength / 1.9);
  return -maxElevation * k * Math.sin(normalized * (Math.PI / 2));
};

export const FirstPersonCamera: React.FC<FirstPersonCameraProps> = ({ 
  enabled, 
  speed = 0.3 
}) => {
  const { camera } = useThree();
  const positionRef = useRef({ x: -90, lane: 5.5, direction: 1 });
  const smoothLookAt = useRef(new THREE.Vector3());
  
  // Camera height offset (driver's eye level)
  const cameraHeight = 1.8;
  
  // Lane position (right lane going toward Barito Kuala - same direction as traffic)
  // In Traffic.tsx: z=-5.5 has direction=-1 (going from positive x to negative x)
  const laneZ = 5.5;
  const direction = -1;

  // Store initial camera settings
  const initialCamera = useMemo(() => ({
    position: camera.position.clone(),
    fov: (camera as THREE.PerspectiveCamera).fov
  }), []);

  useFrame((state, delta) => {
    if (!enabled) {
      // Reset camera when disabled
      return;
    }

    const pos = positionRef.current;
    
    // Move along the bridge (direction matches traffic flow)
    pos.x += speed * direction;
    
    // Loop back when reaching the end
    if (pos.x > 95) {
      pos.x = -95;
    } else if (pos.x < -95) {
      pos.x = 95;
    }
    
    // Calculate position on bridge
    const z = getCurveZ(pos.x) + laneZ;
    const y = getElevation(pos.x) + 2 + cameraHeight;
    
    // Calculate yaw (horizontal rotation) based on curve
    const spanLength = 220;
    const curveIntensity = 50;
    const k = Math.PI / 2 / (spanLength / 1.8);
    const normalizedX = (pos.x / (spanLength / 1.8)) * (Math.PI / 2);
    const dzdx = -k * Math.sin(normalizedX) * curveIntensity;
    
    // Look ahead position
    const lookAheadDist = 15;
    const lookX = pos.x + lookAheadDist * direction;
    const lookZ = getCurveZ(lookX) + laneZ;
    const lookY = getElevation(lookX) + 2 + cameraHeight * 0.8;
    
    // Smooth camera position
    camera.position.lerp(
      new THREE.Vector3(pos.x, y, z),
      0.1
    );
    
    // Smooth look-at
    smoothLookAt.current.lerp(
      new THREE.Vector3(lookX, lookY, lookZ),
      0.08
    );
    camera.lookAt(smoothLookAt.current);
    
    // Adjust FOV for speed feeling
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const targetFov = 65 + Math.abs(speed) * 20;
    perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, targetFov, 0.05);
    perspectiveCamera.updateProjectionMatrix();
  });

  // Reset camera when mode changes
  React.useEffect(() => {
    if (!enabled) {
      // Restore original camera position
      camera.position.copy(initialCamera.position);
      (camera as THREE.PerspectiveCamera).fov = initialCamera.fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    } else {
      // Reset driving position - start from Banjarmasin side (positive x) going toward Barito Kuala
      positionRef.current = { x: 90, lane: -5.5, direction: -1 };
      smoothLookAt.current.set(0, 20, 0);
    }
  }, [enabled, camera, initialCamera]);

  return null; // This component only controls the camera
};
