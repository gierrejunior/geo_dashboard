# Quick Start Guide

## 30-Second Setup

1. **Open in Browser**
   ```bash
   python3 -m http.server 8000
   # Then visit: http://localhost:8000
   ```

2. **Or Deploy to GitHub Pages**
   - Push this folder to `your-username.github.io` repository
   - Visit: `https://your-username.github.io/geo-dashboard`

3. **Done!** 🗺️

## What You Get (Out of the Box)

✅ **Mapa interativo** com 4 basemaps gratuitos (OpenStreetMap, Carto Light/Dark, Esri Imagery)
✅ **3 camadas de exemplo** carregadas (World Countries, Satellite Imagery, OSM Humanitarian)
✅ **Painel lateral** com controles de visibilidade, opacidade, reordenação
✅ **Legenda dinâmica** que mostra apenas camadas visíveis
✅ **Busca de feições** - pesquise por atributos
✅ **Popups interativos** - clique em uma feição para ver seus dados
✅ **Indicadores em tempo real** - total de camadas, visíveis, features
✅ **Tema claro/escuro** - clique no ícone sol/lua no header
✅ **Bookmarks** - salve vistas do mapa (zoom, centro, camadas)
✅ **Layer Swipe** - compare duas camadas com um slider

## First 5 Minutes

### 1. Explore the Default Layers
- Click the hamburger menu (☰) to open the sidebar
- You'll see 3 layers: World Cities, Satellite Imagery, OSM Humanitarian
- Toggle them on/off with the checkboxes

### 2. Try Search
- Click the **Search** tab
- Type "Brazil" - it will find the country and show results
- Click a result to zoom to it and see the popup

### 3. Switch Theme
- Click the sun/moon icon (◐) in the top right
- Watch the interface switch to dark mode

### 4. Save a View
- Navigate to a region you like
- Click **Bookmarks** tab
- Click **Save View**, enter a name like "Europe"
- Click **Save View** button
- Your bookmark is saved! Click the bookmark name to restore it anytime

### 5. Add Your Own Layer
- Go back to **Layers** tab
- Paste a GeoJSON URL in the "Layer URL" field
- Example: `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`
- Select "GeoJSON" as type
- Click **Add Layer**
- Your layer appears on the map!

## Adding Your Own Data

### GeoJSON
```
1. Prepare GeoJSON file (points, lines, or polygons)
2. Host it online (GitHub, any public server)
3. Get the raw file URL
4. Paste URL into dashboard
5. Layer appears on map instantly
```

### Raster Tiles (Satellite/Imagery)
```
URL format: https://tiles.example.com/{z}/{x}/{y}.png
```

Example tile servers:
- OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Carto: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`
- Esri: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

### WMS Layers
```
URL: WMS server endpoint
Layer name: specific layer to display
Example: GEBCO Bathymetry
```

## Customizing (Without Coding)

Edit `data/layers-config.json` to:
- Change initial layers
- Set initial visibility
- Customize styles
- Add legends
- Define popup fields

**Example:**
```json
{
  "id": "my-cities",
  "name": "Major Cities",
  "type": "geojson",
  "url": "https://example.com/cities.geojson",
  "visible": true,
  "opacity": 0.8,
  "style": {
    "color": "#FF0000",
    "weight": 2
  },
  "popupFields": ["name", "population"]
}
```

## Features (Full List)

### Layer Management
- ✅ Add/Remove layers dynamically
- ✅ Toggle visibility on/off
- ✅ Adjust opacity (0-100%)
- ✅ Reorder layers (change z-order)
- ✅ Zoom to layer bounds
- ✅ Show legend
- ✅ Show popup with attributes

### Supported Formats
- ✅ GeoJSON (features, collections)
- ✅ Raster XYZ tiles (satellite, street maps)
- ✅ WMS (Web Map Service)

### Map Features
- ✅ 4 basemaps included
- ✅ Zoom in/out
- ✅ Pan by dragging
- ✅ Mouse/trackpad wheel zoom
- ✅ Attribution for each layer

### Search & Discovery
- ✅ Full-text search across features
- ✅ Search by attribute name/value
- ✅ Click result to zoom & show popup
- ✅ Search limits to 20 results (performance)

### View Management
- ✅ Save bookmarks with map state
- ✅ Restore bookmarks with one click
- ✅ Delete bookmarks
- ✅ Persistence with localStorage

### Comparison Tools
- ✅ Layer swipe/comparison tool
- ✅ Select 2 layers to compare
- ✅ Drag slider to reveal layers

### Theme & UI
- ✅ Light/Dark theme toggle
- ✅ Responsive (desktop & mobile)
- ✅ Compact, modern design
- ✅ Keyboard accessible

### Indicators
- ✅ Total layers count
- ✅ Visible layers count  
- ✅ Total features count
- ✅ Real-time updates

## Troubleshooting

### "Failed to fetch layer"
- Check URL is correct
- Verify server supports CORS
- Try a different public GeoJSON source

### "Popup not showing"
- Layer must be GeoJSON
- Feature must have properties
- Click directly on the feature

### "Layer not visible on map"
- Check layer visibility checkbox
- Zoom in/out (layer might be at different zoom level)
- Check opacity (might be set to 0%)

### "Map won't load"
- Check browser console for errors (F12)
- Try a different browser
- Clear cache and reload

## Public Data Sources

**GeoJSON:**
- GitHub Datasets: https://github.com/datasets/
- Natural Earth: https://www.naturalearthdata.com/
- Earthquake Data: https://earthquake.usgs.gov/earthquakes/feed/

**Tiles:**
- OpenStreetMap
- Carto
- Esri Maps

**WMS:**
- USGS National Map
- GEBCO Bathymetry
- Various government agencies

## Next Steps

- Read `README.md` for full documentation
- Read `ARCHITECTURE.md` for technical details
- Customize `data/layers-config.json` with your layers
- Deploy to GitHub Pages
- Share your dashboard!

## Need Help?

1. Check the console (F12) for error messages
2. Read the full documentation in `README.md`
3. Review `ARCHITECTURE.md` for technical details
4. Check if your data source supports CORS

---

**Happy mapping! 🗺️ Questions? Read README.md for more details.**
