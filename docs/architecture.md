# Architecture

The app loads a manifest, then a separately cacheable city pack. A module worker validates and indexes tree records. Compact results are returned to a small immutable UI store. MapLibre renders GeoJSON through clustered GPU layers; selection uses feature state. Routing is an abortable provider boundary.
