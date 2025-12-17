import React from 'react';
import { SimulationState, CameraMode } from '../types';

interface SettingsPanelProps {
  simState: SimulationState;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (key: keyof SimulationState, value: number | CameraMode) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  simState,
  isOpen,
  onToggle,
  onChange,
}) => {
  const getWeatherLabel = (value: number) => {
    if (value < -66) return 'Hujan Lebat';
    if (value < -33) return 'Hujan Sedang';
    if (value < 0) return 'Hujan Ringan';
    if (value === 0) return 'Normal';
    if (value < 33) return 'Hangat';
    if (value < 66) return 'Panas';
    return 'Sangat Panas';
  };

  const getWeatherColor = (value: number) => {
    if (value < 0) return 'text-blue-400';
    if (value === 0) return 'text-gray-300';
    return 'text-orange-400';
  };

  return (
    <>
      {/* Toggle Button (when panel is closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-2xl hover:bg-black/70 transition-all duration-300 group"
          aria-label="Open Settings"
        >
          <svg
            className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* Settings Panel (when open) */}
      {isOpen && (
        <div className="absolute top-4 left-4 z-10 w-80 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-white/10 text-white shadow-2xl animate-slideIn">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              Jembatan Basit
            </h1>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Close Settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

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
                onChange={(e) => onChange('time', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Malam</span>
                <span>Siang</span>
                <span>Malam</span>
              </div>
            </div>

            {/* Weather Slider */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Cuaca</span>
                <span className={`font-mono ${getWeatherColor(simState.weather)}`}>
                  {getWeatherLabel(simState.weather)}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={simState.weather}
                onChange={(e) => onChange('weather', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #9ca3af 50%, #f97316 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                  Hujan
                </span>
                <span>Normal</span>
                <span className="flex items-center gap-1">
                  Panas
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
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
                onChange={(e) => onChange('fogDensity', parseFloat(e.target.value))}
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
                onChange={(e) => onChange('trafficDensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {/* Camera Mode Toggle */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Mode Kamera</span>
                <span className="font-mono text-cyan-400">
                  {simState.cameraMode === 'firstPerson' ? 'POV Pengendara' : 'Orbit'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange('cameraMode', 'orbit')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    simState.cameraMode === 'orbit'
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Orbit
                  </div>
                </button>
                <button
                  onClick={() => onChange('cameraMode', 'firstPerson')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    simState.cameraMode === 'firstPerson'
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    POV
                  </div>
                </button>
              </div>
              {simState.cameraMode === 'firstPerson' && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  🚗 Nikmati sensasi berkendara melintasi jembatan!
                </p>
              )}
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
      )}
    </>
  );
};
