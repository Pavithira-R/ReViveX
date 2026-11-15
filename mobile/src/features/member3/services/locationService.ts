// ============================================================================
// Member 3 - Location Service
// Implements 3-tier location hierarchy: GPS (Live) -> Profile (Saved) -> Manual City
// Handles runtime Android location permissions via shared capability layer
// ============================================================================

import {
  LocationCoordinates,
  UserLocationState,
  CityPreset,
  LocationPermissionStatus,
} from '../types';
import {
  DEFAULT_USER_COORDINATES,
  SRI_LANKA_CITY_PRESETS,
  findNearestCityPreset,
} from '../utils/location';
import { requestCapability } from '../../../services/capabilities';

// Active in-memory location state
let currentLocationState: UserLocationState = {
  coordinates: DEFAULT_USER_COORDINATES,
  source: 'MANUAL',
  cityName: 'Colombo',
  district: 'Colombo',
  permissionStatus: 'PROMPT',
  isLiveGps: false,
  error: null,
};

type LocationListener = (state: UserLocationState) => void;
const listeners: Set<LocationListener> = new Set();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener(currentLocationState);
    } catch (err) {
      console.error('Error notifying location listener:', err);
    }
  });
}

/**
 * Requests Android fine & coarse location runtime permissions via shared capability layer
 */
export async function requestAndroidLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const status = await requestCapability('location');
    if (status === 'available') {
      return 'GRANTED';
    } else if (status === 'denied') {
      return 'DENIED';
    } else {
      return 'UNAVAILABLE';
    }
  } catch (err) {
    console.warn('Failed to request location permission via capability layer:', err);
    return 'UNAVAILABLE';
  }
}

/**
 * Queries device GPS coordinates using standard Geolocation API with timeout
 */
function queryDeviceGeolocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    const geo = (globalThis as any).navigator?.geolocation;

    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      reject(new Error('Device Geolocation API unavailable'));
      return;
    }

    geo.getCurrentPosition(
      (position: any) => {
        if (position && position.coords) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } else {
          reject(new Error('Invalid geolocation position payload received'));
        }
      },
      (error: any) => {
        reject(error || new Error('Geolocation lookup failed'));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Executes the 3-Tier Location Acquisition Hierarchy:
 * Tier 1: Real-time Android GPS
 * Tier 2: User profile saved location (if GPS fails/denied)
 * Tier 3: Manual Sri Lankan City/District selection
 */
export async function resolveUserLocation(profileFallback?: {
  coordinates?: LocationCoordinates | null;
  cityName?: string | null;
  district?: string | null;
}): Promise<UserLocationState> {
  // --- TIER 1: Attempt Live Device GPS ---
  const permission = await requestAndroidLocationPermission();

  if (permission === 'GRANTED') {
    try {
      const liveCoords = await queryDeviceGeolocation();
      const nearestCity = findNearestCityPreset(liveCoords);

      currentLocationState = {
        coordinates: liveCoords,
        source: 'GPS',
        cityName: nearestCity.name,
        district: nearestCity.district,
        permissionStatus: 'GRANTED',
        isLiveGps: true,
        error: null,
      };

      notifyListeners();
      return currentLocationState;
    } catch (gpsError: any) {
      console.warn('Live GPS query failed or timed out. Falling back...', gpsError?.message);
    }
  }

  // --- TIER 2: Saved Profile Location Fallback ---
  if (
    profileFallback?.coordinates &&
    typeof profileFallback.coordinates.latitude === 'number' &&
    typeof profileFallback.coordinates.longitude === 'number'
  ) {
    const nearest = findNearestCityPreset(profileFallback.coordinates);
    currentLocationState = {
      coordinates: profileFallback.coordinates,
      source: 'PROFILE',
      cityName: profileFallback.cityName || nearest.name,
      district: profileFallback.district || nearest.district,
      permissionStatus: permission,
      isLiveGps: false,
      error: permission === 'DENIED' ? 'GPS permission denied. Using profile address.' : null,
    };

    notifyListeners();
    return currentLocationState;
  }

  // --- TIER 3: Manual City Selection Fallback ---
  // If the user previously selected a manual city, preserve it; otherwise default to Colombo preset
  const fallbackCity =
    currentLocationState.source === 'MANUAL'
      ? SRI_LANKA_CITY_PRESETS.find((c) => c.name === currentLocationState.cityName) ||
        SRI_LANKA_CITY_PRESETS[0]
      : SRI_LANKA_CITY_PRESETS[0];

  currentLocationState = {
    coordinates: fallbackCity.coordinates,
    source: 'MANUAL',
    cityName: fallbackCity.name,
    district: fallbackCity.district,
    permissionStatus: permission,
    isLiveGps: false,
    error: permission === 'DENIED' ? 'GPS permission denied. Select your city manually.' : null,
  };

  notifyListeners();
  return currentLocationState;
}

/**
 * Manually sets the user's active city from the preset list
 */
export function setManualCity(city: CityPreset): UserLocationState {
  currentLocationState = {
    coordinates: city.coordinates,
    source: 'MANUAL',
    cityName: city.name,
    district: city.district,
    permissionStatus: currentLocationState.permissionStatus,
    isLiveGps: false,
    error: null,
  };

  notifyListeners();
  return currentLocationState;
}

/**
 * Returns the current synchronous location state
 */
export function getLocationState(): UserLocationState {
  return currentLocationState;
}

/**
 * Subscribes a component to location updates
 */
export function subscribeToLocation(listener: LocationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
