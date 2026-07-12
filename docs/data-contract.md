# City pack contract

A city manifest identifies its city, locale, timezone, bounds, versioned data pack, attribution and capability flags. Tree records require a stable ID and WGS84 latitude/longitude. Seasonal bloom and harvest masks use the lowest 12 bits (January through December). Heights use metres and diameters centimetres. Invalid coordinates, IDs, masks, and missing attribution are rejected before rendering.

The engine never contains city-specific values. City adapters own municipal input transformation; manifests own capability and licensing declarations.
