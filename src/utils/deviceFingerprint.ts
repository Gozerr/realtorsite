import * as crypto from 'crypto';

export interface DeviceInfo {
  deviceId: string;
  deviceFingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  ipAddress?: string;
  location?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
}

/**
 * Генерация уникального ID устройства
 */
export function generateDeviceId(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Используем более стабильные характеристики устройства
  const data = `${platform}-${language}-${timezone}-${Date.now()}`;
  
  // Простой хеш
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Генерация fingerprint устройства с учетом браузера
 */
export function generateDeviceFingerprint(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Определяем тип браузера
  const browserInfo = getBrowserInfo();
  
  const data = `${platform}-${language}-${timezone}-${browserInfo.browser}-${browserInfo.version}`;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Определение информации о браузере
 */
function getBrowserInfo(): { browser: string; version: string } {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    return { browser: 'Chrome', version: getVersion(userAgent, 'Chrome') };
  } else if (userAgent.includes('Firefox')) {
    return { browser: 'Firefox', version: getVersion(userAgent, 'Firefox') };
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return { browser: 'Safari', version: getVersion(userAgent, 'Safari') };
  } else if (userAgent.includes('Edge')) {
    return { browser: 'Edge', version: getVersion(userAgent, 'Edge') };
  } else if (userAgent.includes('Opera')) {
    return { browser: 'Opera', version: getVersion(userAgent, 'Opera') };
  } else {
    return { browser: 'Unknown', version: 'Unknown' };
  }
}

/**
 * Извлечение версии браузера
 */
function getVersion(userAgent: string, browserName: string): string {
  const match = userAgent.match(new RegExp(`${browserName}/([\\d.]+)`));
  return match ? match[1] : 'Unknown';
}

/**
 * Определение типа устройства
 */
function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Получение информации об устройстве
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const deviceType = getDeviceType();
  const browserInfo = getBrowserInfo();
  
  return {
    deviceId: generateDeviceId(),
    deviceFingerprint: generateDeviceFingerprint(),
    userAgent,
    screenResolution: 'unknown',
    timezone,
    language,
    deviceType,
    browser: browserInfo.browser,
    browserVersion: browserInfo.version,
  };
}

/**
 * Получение IP адреса (через внешний сервис)
 */
export async function getIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Не удалось получить IP адрес:', error);
    return 'unknown';
  }
}

/**
 * Получение геолокации (город/страна)
 */
export async function getLocation(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return `${data.city}, ${data.country_name}`;
  } catch (error) {
    console.warn('Не удалось получить геолокацию:', error);
    return 'unknown';
  }
}

/**
 * Получение полной информации об устройстве
 */
export async function getFullDeviceInfo(): Promise<DeviceInfo> {
  const baseInfo = getDeviceInfo();
  const [ipAddress, location] = await Promise.all([
    getIpAddress(),
    getLocation(),
  ]);
  
  return {
    ...baseInfo,
    ipAddress,
    location,
  };
} 