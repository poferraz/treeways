# ADR 0001: Versioned city packs and GPU layers

City data is fetched as a separate, versioned city pack and decoded in a module worker. MapLibre GeoJSON sources and layers render municipal trees; DOM markers are prohibited because their cost grows with record count.
