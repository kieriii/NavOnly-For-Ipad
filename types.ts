export enum AppMode {
  NORMAL = 'NORMAL',
  NAV_MODE = 'NAV_MODE',
  FULL_NAV = 'FULL_NAV'
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

export interface LocationData {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

export interface NavigationState {
  isTrafficEnabled: boolean;
  isNavModeEnabled: boolean;
  origin: string;
  destination: string | null;
  currentStepIndex: number;
  routeSteps: Array<{
    instruction: string;
    distance: string;
    type: string;
  }>;
  totalDistance?: string;
  totalDuration?: string;
  theme: ThemeMode;
}