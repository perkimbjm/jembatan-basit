import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import maplibregl from 'maplibre-gl';
import { SceneContainer } from './components/SceneContainer';
import { SimulationState, BRIDGE_COORDS } from './types';

const App: React.FC = () => {
  const [simState, setSimState] = useState<SimulationState>({
    time: 18.5, // Start at sunset
    fogDensity: 30,
    trafficDensity: 60,
    zoom: 5,
  });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Dark style fits the voxel theme
      center: [BRIDGE_COORDS.lng, BRIDGE_COORDS.lat],
      zoom: 16.5,
      pitch: 60,
      bearing: -45,
    });

    map.on('load', () => {
      setMapInstance(map);
    });
    
    // Note: We do not sync state back to React on 'move' to avoid performance thrashing.
    // The SceneContainer reads directly from the map instance via useFrame.

    return () => {
      map.remove();
    };
  }, []);

  const handleChange = (key: keyof SimulationState, value: number) => {
    setSimState((prev) => ({ ...prev, [key]: value }));
  };

  // Function to fly to bridge
  const resetCamera = () => {
    mapInstance?.flyTo({
      center: [BRIDGE_COORDS.lng, BRIDGE_COORDS.lat],
      zoom: 16.5,
      pitch: 60,
      bearing: -45,
      essential: true
    });
  };

  return (
    <div className="relative w-full h-full bg-black">
      
      {/* MapLibre Layer (Background/Controller) */}
      <div ref={mapContainer} className="absolute inset-0 z-0" id="map" />

      {/* Three.js Layer (Overlay) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ 
            alpha: true, 
            antialias: true, 
            stencil: false, 
            depth: true,
            preserveDrawingBuffer: true 
          }}
          // Camera is controlled by SceneContainer via Map sync
        >
          {mapInstance && <SceneContainer state={simState} map={mapInstance} />}
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20 w-80 bg-black/80 backdrop-blur-md p-6 rounded-xl border border-white/10 text-white shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
             <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              Jembatan Basit
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              WebGIS 3D • Banjarmasin
            </p>
          </div>
          <button 
            onClick={resetCamera}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Reset Kamera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 mt-6">
          {/* Time Slider */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Waktu (Jam)</span>
              <span className="font-mono text-orange-400">{simState.time.toFixed(1)}</span>
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
              <span className="text-gray-300">Kabut / Atmosfer</span>
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

           {/* Instructions */}
           <div className="bg-white/5 rounded-lg p-3 text-xs text-gray-400 mt-4 border border-white/5">
            <p className="mb-1 font-semibold text-gray-300">Kontrol Peta:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Klik kiri + geser: Pindah lokasi</li>
              <li>Klik kanan + geser: Putar & Miringkan</li>
              <li>Scroll: Zoom in/out</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-[10px] text-gray-500 leading-relaxed">
          <p>
            <strong className="text-gray-300">Sistem:</strong> MapLibre GL JS + Three.js
            <br />
            <strong className="text-gray-300">Data:</strong> OpenStreetMap contributors
          </p>
        </div>
      </div>

      <Loader />
    </div>
  );
};

export default App;