import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { SceneContainer } from './components/SceneContainer';
import { SimulationState } from './types';

const App: React.FC = () => {
  const [simState, setSimState] = useState<SimulationState>({
    time: 12,
    fogDensity: 20,
    trafficDensity: 50,
    zoom: 5,
  });

  const handleChange = (key: keyof SimulationState, value: number) => {
    setSimState((prev) => ({ ...prev, [key]: value }));
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

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 w-80 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-white/10 text-white shadow-2xl">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
          Jembatan Basit
        </h1>
        <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-semibold">
          Simulasi Sei Alalak - Banjarmasin
        </p>

        <div className="space-y-5">
          {/* Time Slider */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Waktu</span>
              <span className="font-mono text-orange-400">{simState.time.toFixed(1)}h</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={simState.time}
              onChange={(e) => handleChange('time', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Malam</span>
              <span>Siang</span>
              <span>Malam</span>
            </div>
          </div>

          {/* Fog Slider */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Kabut Sungai</span>
              <span className="font-mono text-blue-300">{simState.fogDensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simState.fogDensity}
              onChange={(e) => handleChange('fogDensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Traffic Slider */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Kepadatan Lalu Lintas</span>
              <span className="font-mono text-green-300">{simState.trafficDensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simState.trafficDensity}
              onChange={(e) => handleChange('trafficDensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500 leading-relaxed">
          <p>
            <strong className="text-gray-300">Tipe:</strong> Cable Stayed Melengkung
            <br />
            <strong className="text-gray-300">Lokasi:</strong> Kalsel, Indonesia
          </p>
        </div>
      </div>

      <Loader />
    </div>
  );
};

export default App;