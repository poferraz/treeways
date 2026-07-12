const [city, source] = process.argv.slice(2);
if (!city || !source) throw new Error('Usage: npm run city:import -- <city> <source-file>');
console.log(`Import adapter entry point ready for ${city}: ${source}`);
