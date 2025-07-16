export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const url = `/api/geocode?address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
      return { lat: data.lat, lng: data.lng };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getCityByIP(): Promise<string | null> {
  try {
    // 1. SypexGeo (российский, быстрый)
    const sx = await fetch('https://api.sypexgeo.net/json/');
    if (sx.ok) {
      const data = await sx.json();
      if (data && data.city && data.city.name_ru) {
        return data.city.name_ru;
      }
    }
    // 2. ip-api.com (часто работает в РФ)
    const ipapi = await fetch('http://ip-api.com/json/');
    if (ipapi.ok) {
      const data = await ipapi.json();
      if (data && data.city) {
        return data.city;
      }
    }
    // 3. ipapi.co (международный)
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data && data.city) {
        return data.city;
      }
    }
    // 4. freeipapi.com (международный)
    const response2 = await fetch('https://freeipapi.com/api/json');
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2 && data2.cityName) {
        return data2.cityName;
      }
    }
    return null;
  } catch (error) {
    console.error('Ошибка определения города по IP:', error);
    return null;
  }
}