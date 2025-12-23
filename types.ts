
export enum AppMode {
  NORMAL = 'NORMAL',
  NAV_MODE = 'NAV_MODE',
  FULL_NAV = 'FULL_NAV'
}

export enum ThemeMode {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
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

export interface RouteStep {
  instruction: string;
  distance: string;
  type: 'straight' | 'left' | 'right' | 'arrival' | 'slight_left' | 'slight_right' | 'u_turn';
}

export interface NavigationState {
  isTrafficEnabled: boolean;
  isNavModeEnabled: boolean;
  origin: string;
  destination: string | null;
  currentStepIndex: number;
  routeSteps: RouteStep[];
  theme: ThemeMode;
  totalDistance?: string;
  totalDuration?: string;
}

export interface TutorStep {
  id: number;
  title: string;
  content: string;
  code?: string;
}
