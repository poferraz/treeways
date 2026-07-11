const fs = require('fs');
const path = require('path');

async function fetchCuratedTrees() {
  console.log("Fetching curated edible and flowering trees from Vancouver Open Data API...");
  
  // Define query for edible fruit & nut trees
  const edibleQuery = "(" + [
    "genus_name='FICUS'",
    "genus_name='JUGLANS'",
    "genus_name='CASTANEA'",
    "genus_name='MORUS'",
    "genus_name='CORYLUS'",
    "(genus_name='PRUNUS' and (species_name='AVIUM' or species_name='CERASUS' or species_name='DOMESTICA' or common_name='CHERRY PLUM'))",
    "(genus_name='MALUS' and (species_name='PUMILA' or species_name='DOMESTICA' or common_name='COMMON APPLE' or common_name='APPLE TREE'))"
  ].join(" or ") + ")";

  // Define query for spectacular mature flowering trees (cherries, magnolias, dogwoods with height > 6 meters or diameter > 25cm to filter for impressive ones)
  const showyQuery = "(" + [
    "(genus_name='PRUNUS' and species_name='SERRULATA' and diameter_cm > 35)", // Kwanzan / Japanese Cherries
    "(genus_name='PRUNUS' and species_name='X YEDOENSIS' and diameter_cm > 35)", // Yoshino / Akebono
    "(genus_name='MAGNOLIA' and diameter_cm > 25)", // Mature Magnolias
    "(genus_name='CORNUS' and diameter_cm > 25)" // Mature Dogwoods
  ].join(" or ") + ")";

  const combinedQuery = `${edibleQuery} or ${showyQuery}`;
  
  let limit = 100;
  let offset = 0;
  let hasMore = true;
  const trees = [];

  while (hasMore) {
    // Select only needed fields to keep the file size extremely small
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records?select=asset_id%2Ccommon_name%2Cgenus_name%2Cspecies_name%2Cheight_m%2Cdiameter_cm%2Caddress%2Cgeo_point_2d&where=${encodeURIComponent(combinedQuery)}&limit=${limit}&offset=${offset}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const results = data.results || [];
      
      if (results.length === 0) {
        hasMore = false;
      } else {
        trees.push(...results);
        console.log(`Fetched ${trees.length} trees (offset: ${offset})...`);
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      hasMore = false;
    }
  }

  console.log(`Total curated trees fetched: ${trees.length}`);

  // Now parse them and match them with our species details to attach seasonal tags, colors, and descriptions.
  const speciesList = require('../src/data/categorized_species.json');
  const speciesMap = {};
  speciesList.forEach(s => {
    const key = `${s.genus}:${s.species}:${s.common}`;
    speciesMap[key] = s;
  });

  const parsedTrees = trees.map(t => {
    const genus = (t.genus_name || '').toUpperCase().trim();
    const species = (t.species_name || '').toUpperCase().trim();
    const common = (t.common_name || '').toUpperCase().trim();
    
    const key = `${genus}:${species}:${common}`;
    const speciesInfo = speciesMap[key] || {};

    return {
      id: t.asset_id,
      name: t.common_name,
      genus: t.genus_name,
      species: t.species_name,
      height: t.height_m,
      diameter: t.diameter_cm,
      address: t.address,
      lat: t.geo_point_2d?.lat,
      lng: t.geo_point_2d?.lon,
      type: speciesInfo.type || (genus === 'PRUNUS' || genus === 'MAGNOLIA' || genus === 'CORNUS' ? 'flower' : 'fruit'),
      tags: speciesInfo.tags || [],
      bloom: speciesInfo.bloomMonths || [],
      harvest: speciesInfo.harvestMonths || [],
      usefulness: speciesInfo.usefulness || ''
    };
  }).filter(t => t.lat && t.lng); // Filter out trees without coordinates

  fs.writeFileSync(
    path.join(__dirname, '../src/data/curated_trees.json'),
    JSON.stringify(parsedTrees, null, 2)
  );

  console.log(`Successfully saved ${parsedTrees.length} curated trees to src/data/curated_trees.json`);
}

fetchCuratedTrees();
