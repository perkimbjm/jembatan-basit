import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { SceneContainer } from './components/SceneContainer';
import { SettingsPanel } from './components/SettingsPanel';
import { SimulationState, CameraMode } from './types';

const App: React.FC = () => {
  const [simState, setSimState] = useState<SimulationState>({
    time: 12,
    fogDensity: 20,
    trafficDensity: 50,
    zoom: 5,
    weather: 0, // 0 is normal weather
    cameraMode: 'orbit', // Default to orbit camera
  });

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const handleChange = (key: keyof SimulationState, value: number | CameraMode) => {
    setSimState((prev) => ({ ...prev, [key]: value }));
  };

  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: false, stencil: false, depth: true }}
          camera={{ position: [60, 30, 60], fov: 45 }}
        >
          <SceneContainer state={simState} />
        </Canvas>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        simState={simState}
        isOpen={isPanelOpen}
        onToggle={togglePanel}
        onChange={handleChange}
      />

      <Loader />
    </div>
  );
};

export default App;