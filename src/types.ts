export type CameraMode = 'orbit' | 'firstPerson';

export interface SimulationState {
  time: number; // 0-24
  fogDensity: number; // 0-100
  trafficDensity: number; // 0-100
  zoom: number; // 1-10
  weather: number; // -100 (heavy rain) to 100 (extreme heat), 0 is normal
  cameraMode: CameraMode; // Camera view mode
}

export const BRIDGE_COLORS = {
  internationalOrange: '#C0362C', // Keep for legacy or accent
  concrete: '#e0e0e0', // Lighter concrete
  road: '#222222',
  water: '#1a3b36', // Greenish river water
};