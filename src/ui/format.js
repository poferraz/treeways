export function titleCase(value) {
  return String(value).toLocaleLowerCase().replace(/\b\w/g, letter => letter.toLocaleUpperCase());
}

export function scientificName(tree) {
  const genus = titleCase(tree.genus);
  const species = String(tree.species || '').toLocaleLowerCase();
  return `${genus} ${species}`.trim() || 'Scientific name not recorded';
}
