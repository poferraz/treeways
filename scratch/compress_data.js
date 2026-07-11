const fs = require('fs');
const path = require('path');

function compress() {
  const srcPath = path.join(__dirname, '../src/data/curated_trees.json');
  const destPath = path.join(__dirname, '../src/data/curated_trees_compressed.json');

  if (!fs.existsSync(srcPath)) {
    console.error("Source file does not exist!");
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  console.log(`Original trees count: ${rawData.length}`);

  // Extract unique species configurations
  const speciesList = [];
  const speciesMap = new Map(); // key -> index

  const compressedTrees = [];

  rawData.forEach(tree => {
    const speciesKey = `${tree.genus}:${tree.species}:${tree.name}`;
    let speciesIndex = speciesMap.get(speciesKey);

    if (speciesIndex === undefined) {
      speciesIndex = speciesList.length;
      speciesMap.set(speciesKey, speciesIndex);
      speciesList.push({
        genus: tree.genus,
        species: tree.species,
        name: tree.name,
        type: tree.type,
        tags: tree.tags,
        bloom: tree.bloom,
        harvest: tree.harvest,
        usefulness: tree.usefulness
      });
    }

    // Compress individual tree to a flat array:
    // [ id, lat, lng, speciesIndex, height, diameter, address ]
    compressedTrees.push([
      tree.id,
      parseFloat(tree.lat.toFixed(6)),
      parseFloat(tree.lng.toFixed(6)),
      speciesIndex,
      tree.height || 0,
      tree.diameter || 0,
      tree.address || ''
    ]);
  });

  const output = {
    species: speciesList,
    trees: compressedTrees
  };

  fs.writeFileSync(destPath, JSON.stringify(output));
  console.log(`Compressed file saved to ${destPath}`);
  
  const origSize = fs.statSync(srcPath).size;
  const compSize = fs.statSync(destPath).size;
  console.log(`Original Size: ${(origSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Compressed Size: ${(compSize / 1024).toFixed(2)} KB`);
  console.log(`Reduction: ${((1 - compSize / origSize) * 100).toFixed(1)}%`);

  // Replace original file with the compressed one to keep things clean
  fs.unlinkSync(srcPath);
  fs.renameSync(destPath, srcPath);
  console.log("Renamed compressed file to src/data/curated_trees.json");
}

compress();
