export type NeuralVolumeMode = 'synapse' | 'latent' | 'tensor';

export interface PulseSignal {
  /** Monotonic trigger id so repeated clicks always fire a new wave */
  id: number;
  /** Local-space wave origin within the 3D sculpture */
  origin: [number, number, number];
}
