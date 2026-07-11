export const api = {
  /**
   * Fetches walking route connecting coordinate stops
   * @param {Array<{lat, lng}>} stops 
   * @returns {Promise<{geometry, distance, duration}>}
   */
  async fetchRoute(stops) {
    if (!stops || stops.length < 2) return null;
    const coordString = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?geometries=geojson&overview=full`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;
      
      return {
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance, // meters
        duration: data.routes[0].duration // seconds
      };
    } catch (e) {
      console.error("Failed to calculate route:", e);
      return null;
    }
  },

  /**
   * Fetches generic street trees in a bounding box (live API query fallback)
   */
  async fetchTreesInBounds(south, west, north, east) {
    const query = `in_bbox(geo_point_2d, ${south}, ${west}, ${north}, ${east})`;
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records?where=${encodeURIComponent(query)}&limit=100`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenData HTTP error: ${res.status}`);
      const data = await res.json();
      return (data.results || []).map(t => ({
        id: t.asset_id,
        name: t.common_name,
        genus: t.genus_name,
        species: t.species_name,
        height: t.height_m,
        diameter: t.diameter_cm,
        address: t.address,
        lat: t.geo_point_2d?.lat,
        lng: t.geo_point_2d?.lon,
        type: 'shade', // generic background trees
        tags: ['street-tree'],
        bloom: [],
        harvest: [],
        usefulness: 'Provides urban canopy, carbon sequestration, and shade.'
      })).filter(t => t.lat && t.lng);
    } catch (e) {
      console.error("Failed to fetch trees in bounds:", e);
      return [];
    }
  }
};
