export function getLocation() {
  return new Promise((resolve, reject) => {
    const geolocation = navigator.geolocation;
    if (!geolocation) {
      reject(new Error('Location is unavailable'));
      return;
    }
    geolocation.getCurrentPosition(({ coords }) => {
      resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
    }, reject, { enableHighAccuracy: false, timeout: 10_000 });
  });
}
