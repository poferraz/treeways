# Privacy

Treeways asks for browser location permission when you select **Near me** or **Trees near me**. If you allow it, the app uses your coordinates in memory to centre the map and calculate distances to trees. You can also browse by moving the map or searching the city inventory. Searches run locally against the downloaded tree data.

The map requests its style and tiles from CARTO’s servers. Those requests include your IP address and identify the map area on screen. Using **Near me** can therefore reveal the area around your position to the tile provider.

Your browser keeps the daylight or dusk theme in local storage. The service worker caches the app, Vancouver’s manifest and its highlight pack for offline visits. It also caches the full city pack when you request it. Your location and personal route stops last for the current page session. Clearing the site’s browser data removes its saved theme and offline files.

Choosing **Navigate** opens Google Maps with the selected tree’s coordinates. **Open walking directions** sends the coordinates of your ordered stops to Google Maps. The three reviewed trail routes come from previously saved OpenRouteService results.
