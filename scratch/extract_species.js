const fs = require('fs');
const path = require('path');

async function fetchAllSpecies() {
  const allResults = [];
  let limit = 100;
  let offset = 0;
  let hasMore = true;

  console.log("Fetching unique tree species from Vancouver Open Data API...");

  while (hasMore) {
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records?select=genus_name%2Cspecies_name%2Ccommon_name%2Ccount%28*%29%20as%20cnt&group_by=genus_name%2Cspecies_name%2Ccommon_name&limit=${limit}&offset=${offset}`;
    
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
        allResults.push(...results);
        console.log(`Fetched ${allResults.length} unique species combinations (offset: ${offset})...`);
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      hasMore = false;
    }
  }

  console.log(`Total unique species combinations found: ${allResults.length}`);

  // Now, let's categorize them.
  const categorized = allResults.map(item => {
    const genus = (item.genus_name || '').toUpperCase().trim();
    const species = (item.species_name || '').toUpperCase().trim();
    const common = (item.common_name || '').toUpperCase().trim();
    const cnt = item.cnt || 0;

    let type = 'shade'; // default type
    let tags = [];
    let bloomMonths = [];
    let harvestMonths = [];
    let usefulness = '';

    // Check for Cherry Blossoms & Ornamental/Fruiting Plums/Cherries
    if (genus === 'PRUNUS') {
      if (common.includes('CHERRY') && !common.includes('LAUREL') && !common.includes('CHOKE')) {
        // Is it edible or ornamental?
        if (common.includes('FLOWERING') || common.includes('JAPANESE') || common.includes('AKEBONO') || common.includes('KWANZAN') || common.includes('YOSHINO') || common.includes('UKON') || common.includes('SHIROFUGEN') || common.includes('SHIROTAE')) {
          type = 'flower';
          tags = ['blossom', 'ornamental'];
          bloomMonths = [3, 4, 5]; // March - May
          usefulness = 'Spectacular spring blossoms, highly photogenic cultural heritage.';
        } else if (common.includes('SOUR') || common.includes('SWEET') || species === 'AVIUM' || species === 'CERASUS') {
          type = 'both';
          tags = ['fruit', 'blossom', 'edible'];
          bloomMonths = [4, 5]; // April - May
          harvestMonths = [6, 7]; // June - July
          usefulness = 'Edible cherries and beautiful spring blossoms.';
        } else {
          type = 'flower';
          tags = ['blossom'];
          bloomMonths = [3, 4, 5];
          usefulness = 'Beautiful spring blossoms.';
        }
      } else if (common.includes('PLUM')) {
        if (common.includes('PURPLE') || common.includes('PISSARD') || common.includes('NIGRA') || common.includes('BLIREANA') || common.includes('THUNDERCLOUD')) {
          type = 'flower'; // mostly ornamental purple plums
          tags = ['blossom', 'purple-leaves'];
          bloomMonths = [3, 4]; // Very early bloom
          usefulness = 'Showy early-spring pink blossoms and deep purple foliage.';
        } else if (common.includes('COMMON PLUM') || common.includes('CHERRY PLUM') || species === 'DOMESTICA' || species === 'CERASIFERA' && !common.includes('PISSARD') && !common.includes('NIGRA')) {
          type = 'both';
          tags = ['fruit', 'blossom', 'edible'];
          bloomMonths = [3, 4]; // March - April
          harvestMonths = [8, 9]; // August - September
          usefulness = 'Edible plums (great for jam) and early spring blossoms.';
        } else {
          type = 'flower';
          tags = ['blossom'];
          bloomMonths = [3, 4];
          usefulness = 'Early spring blossoms.';
        }
      } else if (common.includes('PEACH') || common.includes('APRICOT')) {
        type = 'both';
        tags = ['fruit', 'blossom', 'edible'];
        bloomMonths = [3, 4];
        harvestMonths = [8, 9];
        usefulness = 'Edible stone fruits and delicate spring blossoms.';
      }
    } 
    // Check for Apples & Crabapples
    else if (genus === 'MALUS') {
      if (common.includes('COMMON APPLE') || common.includes('APPLE TREE') || species === 'PUMILA' || species === 'DOMESTICA') {
        type = 'both';
        tags = ['fruit', 'blossom', 'edible'];
        bloomMonths = [5]; // May bloom
        harvestMonths = [9, 10]; // September - October
        usefulness = 'Edible apples for foraging, sweet white-pink spring blossoms.';
      } else {
        type = 'both'; // Crabapples are both beautiful flowers and have small sour fruits (good for jelly)
        tags = ['fruit', 'blossom', 'crabapple'];
        bloomMonths = [4, 5]; // April - May
        harvestMonths = [9, 10, 11]; // Fall berries/fruits
        usefulness = 'Stunning spring flower clusters and colorful autumn crabapples (high pectin for jellies).';
      }
    } 
    // Check for Pears
    else if (genus === 'PYRUS') {
      if (common.includes('CALLERY') || common.includes('CHANTICLEER') || common.includes('ARISTOCRAT')) {
        type = 'flower';
        tags = ['blossom', 'ornamental'];
        bloomMonths = [4]; // April white flowers
        usefulness = 'Dense clusters of white flowers in spring, brilliant red autumn foliage.';
      } else {
        type = 'both';
        tags = ['fruit', 'blossom', 'edible'];
        bloomMonths = [4]; // April
        harvestMonths = [8, 9, 10]; // Late summer/fall
        usefulness = 'Edible pears and abundant white spring blossoms.';
      }
    } 
    // Check for Magnolias
    else if (genus === 'MAGNOLIA') {
      type = 'flower';
      tags = ['blossom', 'showy'];
      bloomMonths = [4, 5]; // April - May
      usefulness = 'Large, dramatic, fragrant cup-shaped flowers that appear before the leaves.';
    } 
    // Check for Dogwoods
    else if (genus === 'CORNUS') {
      type = 'flower';
      tags = ['blossom', 'native'];
      bloomMonths = [5, 6]; // May - June
      usefulness = 'Official flower of British Columbia, gorgeous white/pink bracts.';
      if (common.includes('CORNELIAN CHERRY') || species === 'MAS') {
        type = 'both';
        tags = ['fruit', 'blossom', 'edible'];
        bloomMonths = [2, 3]; // Very early yellow bloom
        harvestMonths = [8, 9]; // Late summer edible berries
        usefulness = 'Bright yellow winter flowers and edible tart red berries in late summer.';
      }
    }
    // Check for Chestnuts & Walnuts
    else if (genus === 'CASTANEA') {
      type = 'fruit';
      tags = ['nut', 'edible'];
      bloomMonths = [6, 7]; // Flowers in summer
      harvestMonths = [9, 10]; // Autumn nuts
      usefulness = 'Edible sweet chestnuts (roasted in autumn). Note: Do not confuse with toxic Horse Chestnut.';
    } else if (genus === 'JUGLANS') {
      type = 'fruit';
      tags = ['nut', 'edible'];
      bloomMonths = [5];
      harvestMonths = [9, 10];
      usefulness = 'Edible walnuts (black walnut or English walnut) and valuable shade canopy.';
    } else if (genus === 'FICUS') {
      type = 'fruit';
      tags = ['fruit', 'edible'];
      harvestMonths = [8, 9];
      usefulness = 'Edible sweet figs, lush tropical foliage.';
    } else if (genus === 'MORUS') {
      type = 'fruit';
      tags = ['fruit', 'edible'];
      harvestMonths = [7, 8]; // Summer berries
      usefulness = 'Sweet edible mulberries that resemble blackberries, highly attractive to birds.';
    } else if (genus === 'CORYLUS') {
      type = 'fruit';
      tags = ['nut', 'edible'];
      bloomMonths = [2, 3]; // Early catkins
      harvestMonths = [8, 9]; // Hazelnuts
      usefulness = 'Edible hazelnuts (filberts), attractive winter catkins.';
    } else if (genus === 'AESCULUS') {
      type = 'flower';
      tags = ['blossom', 'conkers'];
      bloomMonths = [5]; // May candles
      harvestMonths = [9, 10]; // Conkers drop (NOT edible, toxic)
      usefulness = 'Huge white/pink flower spikes in spring. Produces shiny brown conkers (toxic).';
    } else if (genus === 'STYRAX') {
      type = 'flower';
      tags = ['blossom'];
      bloomMonths = [6]; // June
      usefulness = 'Delicate, hanging white bell flowers in early summer.';
    } else if (genus === 'SYRINGA') {
      type = 'flower';
      tags = ['blossom', 'fragrant'];
      bloomMonths = [5]; // May
      usefulness = 'Highly fragrant lilac flower clusters.';
    } else if (genus === 'LIRIODENDRON') {
      type = 'flower';
      tags = ['blossom'];
      bloomMonths = [5, 6];
      usefulness = 'Unique yellow-green tulip-shaped flowers, large native shade canopy.';
    }

    return {
      genus,
      species,
      common,
      count: cnt,
      type,
      tags,
      bloomMonths,
      harvestMonths,
      usefulness
    };
  });

  // Filter for only those categorized as flower, fruit, or both
  const selectedSpecies = categorized.filter(item => item.type !== 'shade');

  // Sort by count descending
  selectedSpecies.sort((a, b) => b.count - a.count);

  console.log(`Categorized ${selectedSpecies.length} species as flowering, fruiting, or nut-bearing.`);

  // Write out results
  const outDir = path.dirname(__dirname); // src/data
  fs.mkdirSync(path.join(outDir, 'src', 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'src', 'data', 'categorized_species.json'),
    JSON.stringify(selectedSpecies, null, 2)
  );

  console.log("Categorized species saved to src/data/categorized_species.json");
}

fetchAllSpecies();
