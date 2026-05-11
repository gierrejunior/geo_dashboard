# Geo Dashboard

A modern, responsive geospatial dashboard built with vanilla JavaScript, Leaflet, and HTML/CSS. No backend required—runs directly on GitHub Pages or any static hosting.

## Features

### Core Functionality
- ✅ **Interactive Map** with multiple basemaps (OpenStreetMap, Carto, Esri Imagery)
- ✅ **Layer Management** - Add, remove, reorder, toggle visibility, adjust opacity
- ✅ **Multiple Layer Types** - GeoJSON, Raster XYZ tiles, WMS layers
- ✅ **Dynamic Legends** - Auto-generated legends for visible layers
- ✅ **Feature Search** - Search and highlight features by attribute
- ✅ **Popups** - Click features to view attributes
- ✅ **Indicators Panel** - Real-time stats (total layers, visible layers, features count)
- ✅ **Zoom to Layer** - Quickly navigate to layer bounds
- ✅ **Local State Persistence** - Save custom layers, visibility, opacity to localStorage

### MVP Features
- ✅ **Theme Toggle** - Light/Dark mode support
- ✅ **Bookmarks/Saved Views** - Save map center, zoom, and layer states
- ✅ **Layer Swipe Comparison** - Compare two layers with an interactive slider

## Project Structure

```
geo-dashboard/
├── index.html          # Main HTML structure
├── css/
│   └── style.css       # All styling (light/dark theme)
├── js/
│   ├── app.js          # Main orchestration & state management
│   ├── config.js       # Configuration loading & validation
│   ├── map.js          # Leaflet initialization & basemaps
│   ├── layers.js       # Layer loading (GeoJSON, XYZ, WMS)
│   ├── legend.js       # Dynamic legend generation
│   ├── charts.js       # Indicators & statistics
│   ├── ui.js           # UI interactions (sidebar, search, bookmarks)
│   ├── swipe.js        # Layer swipe comparison
│   └── storage.js      # localStorage management
├── data/
│   ├── basemaps-config.json        # Basemap definitions
│   ├── layers-config.json          # Layer configuration
│   ├── dashboard-config.json       # Project defaults (official state)
│   ├── dashboard-config.example.json # Configuration template
│   └── layers-config.example.json  # Layer template
└── assets/             # Optional: icons, images
```

## Getting Started

### 1. Download or Clone

```bash
# Clone or download this repository
git clone https://github.com/yourusername/geo-dashboard.git
cd geo-dashboard
```

### 2. Deploy to GitHub Pages

1. Create a GitHub repository named `your-username.github.io` or use an existing repo
2. Copy the `geo-dashboard` folder contents to your repository
3. Commit and push to GitHub
4. Your dashboard will be available at `https://your-username.github.io/geo-dashboard/`

### 3. Local Testing

Simply open `index.html` in a web browser:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using Ruby
ruby -run -ehttpd . -p8000
```

Then visit `http://localhost:8000/`

## JSON-Based Configuration Architecture

This dashboard is fully configured through three JSON files. No hardcoded layers or basemaps. Change the JSON files to create different dashboards from the same codebase.

### Configuration Files Overview

#### 1. `data/basemaps-config.json` - Base Map Definitions

Defines available basemaps (background layers).

```json
{
  "id": "osm",
  "name": "OpenStreetMap",
  "type": "xyz",
  "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "default": true,
  "attribution": "© OpenStreetMap contributors",
  "minZoom": 0,
  "maxZoom": 19
}
```

**Supported Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `type` (required): Currently supports `xyz` (XYZ tiles)
- `url` (required): Tile URL template with `{s}`, `{z}`, `{x}`, `{y}` placeholders
- `default`: Boolean - which basemap loads on startup
- `attribution`: Credits/license information
- `minZoom`: Minimum zoom level (default: 0)
- `maxZoom`: Maximum zoom level (default: 28)
- `maxNativeZoom`: Highest zoom level with native tiles
- `subdomains`: Subdomain characters for tile server (e.g., "abc" for OpenStreetMap)

#### 2. `data/layers-config.json` - Layer Definitions

Defines data layers (GeoJSON, WMS, Raster XYZ).

```json
{
  "id": "my_layer",
  "name": "My Layer Name",
  "group": "Environmental",
  "type": "geojson",
  "url": "https://example.com/data.geojson",
  "visible": false,
  "opacity": 0.8,
  "popupFields": ["name", "value"],
  "searchableFields": ["name", "type"]
}
```

**Supported Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `type` (required): `geojson`, `raster-xyz`, or `wms`
- `url` (required): Layer data URL
- `group`: Category for layer panel (default: "Other Layers")
- `description`: Layer description
- `visible`: Boolean - initially visible on load
- `opacity`: Number 0–1 (default: 1)
- `attribution`: Credits/license
- `legend`: Array of legend entries
- `popupFields`: Feature properties to show in popup
- `searchableFields`: Properties to search
- `bounds`: `[[south, west], [north, east]]` for zoom-to-layer
- `minZoom`, `maxZoom`: Visibility zoom range

**GeoJSON-specific:**
- `style`: {color, fillColor, weight, fillOpacity, opacity, dashArray}

**WMS-specific:**
- `layers`: WMS layer names (required)
- `format`: Image format (default: "image/png")
- `transparent`: Boolean (default: true)
- `version`: WMS version
- `styles`: WMS style parameter

**Raster XYZ-specific:**
- `maxNativeZoom`: Highest native resolution zoom
- `subdomains`: Subdomain characters
- `tms`: Boolean for TMS tile order
- `tileSize`: Tile size in pixels (default: 256)

#### 3. `data/dashboard-config.json` - Dashboard State

Defines the official dashboard state—what users see on first load.

```json
{
  "title": "My Dashboard",
  "description": "Description here",
  "initialMap": {
    "center": [-15, -50],
    "zoom": 4
  },
  "activeBasemap": "osm",
  "theme": "light",
  "layers": {
    "visibleLayers": {"layer-id": true},
    "layerOrder": ["layer-id"],
    "layerOpacity": {"layer-id": 0.8}
  },
  "swipe": {
    "enabled": false,
    "leftLayer": null,
    "rightLayer": null
  },
  "legend": {
    "collapsed": false
  },
  "panels": {
    "activeTab": "layers",
    "layersCollapsed": false,
    "indicatorsCollapsed": false
  },
  "bookmarks": []
}
```

**Supported Fields:**
- `title`: Dashboard title
- `description`: Dashboard description
- `initialMap.center`: Starting map center `[latitude, longitude]`
- `initialMap.zoom`: Starting zoom level
- `activeBasemap`: ID of default basemap
- `theme`: "light" or "dark"
- `layers.visibleLayers`: Object mapping layer IDs to visibility (true/false)
- `layers.layerOrder`: Array of layer IDs (drawing order)
- `layers.layerOpacity`: Object mapping layer IDs to opacity 0–1
- `swipe.enabled`: Boolean
- `swipe.leftLayer`, `swipe.rightLayer`: Layer IDs for comparison
- `legend.collapsed`: Boolean
- `panels.activeTab`: "layers", "search", or "bookmarks"
- `panels.layersCollapsed`: Boolean
- `panels.indicatorsCollapsed`: Boolean
- `bookmarks`: Array of saved views

### Understanding Project Config vs. Local Changes

**Official Project State** (`data/*.json`):
- Version-controlled in your repository
- Loaded on startup as the baseline
- Controls what all users see by default
- Use the Export button to update these files

**Local Browser Preferences** (localStorage):
- Saved only in the user's browser
- Includes custom layers added via "Add temporary layer by URL"
- Theme preference
- Bookmarks
- Does NOT override layer visibility/opacity from dashboard-config.json
- Lost when browser localStorage is cleared

### Workflow: Configure → Export → Deploy

1. **Open the dashboard** - starts with project configuration
2. **Configure visually**:
   - Add layers
   - Set visibility, opacity, layer order
   - Save bookmarks
   - Choose theme
   - Arrange everything
3. **Export configuration**:
   - Click **Export Configuration** button
   - A `dashboard-config.json` downloads
   - This captures your current state
4. **Update the project**:
   - Replace `data/dashboard-config.json` with exported file
   - Commit and push to GitHub
5. **Everyone sees your changes**:
   - All users loading the dashboard get the new default state
   - They can still make local changes that won't affect others

### Configuration Buttons

**Export Configuration**
- Downloads current dashboard state as `dashboard-config.json`
- Use this to save a good baseline for your team

**Reset to Project Config**
- Discards all local browser changes
- Reloads the official project configuration from `data/dashboard-config.json`
- Useful if you've made temporary edits and want to start fresh

**Clear Local Changes**
- Removes custom layers and preferences from your browser
- Keeps the official project configuration
- Different from reset—it preserves the current visual state but removes only your additions

### dashboard-config.json Structure

```json
{
  "title": "Geo Dashboard",
  "description": "Interactive geographic data visualization",
  "initialMap": {
    "center": [20, 0],
    "zoom": 2
  },
  "activeBasemap": "osm",
  "theme": "light",
  "layers": {
    "visibleLayers": {
      "layer1": true,
      "layer2": false
    },
    "layerOrder": ["layer1", "layer2"],
    "layerOpacity": {
      "layer1": 0.8,
      "layer2": 0.5
    }
  },
  "swipe": {
    "enabled": false,
    "leftLayer": null,
    "rightLayer": null
  },
  "legend": {
    "collapsed": false
  },
  "panels": {
    "activeTab": "layers",
    "layersCollapsed": false,
    "indicatorsCollapsed": false
  },
  "bookmarks": []
}
```

See `data/dashboard-config.example.json` for a complete example.

## Configuration

### Adding Layers

#### Option 1: Edit `data/layers-config.json`

Edit the layers array to add pre-loaded layers:

```json
{
  "id": "my_layer",
  "name": "My Layer",
  "type": "geojson",
  "url": "https://example.com/my-data.geojson",
  "visible": true,
  "opacity": 0.7,
  "style": {
    "color": "#FF0000",
    "weight": 2,
    "fillOpacity": 0.5
  },
  "legend": {
    "type": "category",
    "categories": [
      {"label": "Category A", "color": "#FF0000"}
    ]
  },
  "popupFields": ["name", "population"]
}
```

#### Option 2: Add via UI

1. Open the dashboard
2. Go to **Layers** tab
3. Enter:
   - Layer name
   - Layer URL
   - Layer type (GeoJSON, Raster XYZ, WMS)
4. Click **Add Layer**

The layer is automatically saved to localStorage and will persist across sessions.

### Layer Naming System

Each layer has four name-related fields to support flexible display in the UI:

| Field | Purpose | Editable | Example |
|-------|---------|----------|---------|
| **id** | Stable technical identifier | ❌ No | `test_features` |
| **originalName** | Technical/source name | ❌ No | `Test Features (Local)` |
| **displayName** | Friendly UI name | ✅ Yes | `Test Features` |
| **legendTitle** | Custom legend heading | ✅ Yes | `Land Use Classes` |

#### How It Works

1. **Default Names** come from `data/layers-config.json`:
   ```json
   {
     "id": "forest_cover",
     "name": "fcov_2023",
     "displayName": "Forest Coverage 2023",
     "legendTitle": "Forest Type & Extent"
   }
   ```

2. **Rename in UI**: Click the pencil (✏) button next to any layer in the **Layers** panel
   - Edit the display name for the layer panel
   - Optionally set a custom legend title
   - Original technical name is shown as read-only reference

3. **Persistence**: Custom names are saved in `dashboard-config.json`
   ```json
   {
     "layerDisplayNames": {
       "forest_cover": "My Custom Forest Layer"
     },
     "layerLegendTitles": {
       "forest_cover": "Forest Classification"
     }
   }
   ```

4. **Display Priority**:
   - Panel header: Shows `displayName`
   - Legend title: Shows `legendTitle` if set, otherwise `displayName`
   - Original name: Visible in rename dialog for reference

#### Fallback Logic

If not explicitly set, names fall back in this order:
- `displayName` ← config.displayName → config.name → config.id
- `legendTitle` ← config.legendTitle → null (uses displayName in legend)
- `originalName` ← config.originalName → config.name → config.id

### Layer Types

#### GeoJSON
A collection of geographic features with properties.

```json
{
  "id": "cities",
  "name": "World Cities",
  "type": "geojson",
  "url": "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
  "visible": true,
  "popupFields": ["ADMIN", "CONTINENT"]
}
```

**Public GeoJSON sources:**
- [Natural Earth Data](https://www.naturalearthdata.com/)
- [GitHub Datasets](https://github.com/datasets/)
- [OpenStreetMap Data](https://osmdata.openstreetmap.de/)
- [Earthquake USGS Feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)

#### Raster XYZ Tiles
Map tiles in XYZ format (typical web tile format).

```json
{
  "id": "satellite",
  "name": "Satellite Imagery",
  "type": "raster-xyz",
  "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  "visible": false,
  "maxZoom": 18
}
```

**Free tile servers:**
- OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Carto Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`
- Carto Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
- Esri Imagery: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

#### WMS (Web Map Service)
Standard OGC Web Map Service layers.

```json
{
  "id": "gebco",
  "name": "GEBCO Bathymetry",
  "type": "wms",
  "url": "https://www.gebco.net/wms/gebco/1.3.0/wms.aspx",
  "layers": "gebco_2023",
  "transparent": true,
  "format": "image/png",
  "visible": false
}
```

**Public WMS servers:**
- [USGS National Map](https://basemap.nationalmap.gov/arcgis/services/)
- [OpenStreetMap WMS](https://ows.mundialis.de/services/service)
- [GEBCO Bathymetry](https://www.gebco.net/wms/gebco/1.3.0/wms.aspx)

## Usage Guide

### Layer Panel
- **Toggle visibility**: Click checkbox next to layer name
- **Adjust opacity**: Use slider
- **Move up/down**: Click ↑ or ↓ buttons (controls z-order)
- **Zoom to layer**: Click 🔍 button
- **Remove layer**: Click ✕ button

### Search
1. Click **Search** tab
2. Type to search features by attribute
3. Click result to zoom and show popup
4. Search clears automatically after selection

### Bookmarks
1. Click **Bookmarks** tab
2. Enter bookmark name
3. Click **Save View** (saves current map state)
4. Click bookmark name to restore
5. Click ✕ to delete bookmark

### Layer Swipe Comparison
1. Click **Enable Layer Swipe** in Tools section
2. Select layer 1 and layer 2 to compare
3. Drag the slider to compare layers side-by-side

### Theme Toggle
Click the sun/moon icon in the header to toggle between light and dark themes.

### Managing Dashboard State

See the **Configuration** section above for detailed workflow.

**Export Configuration** (Configuration panel)
- Downloads current dashboard state
- Share with your team or save as backup
- Update `data/dashboard-config.json` in your repository

**Reset to Project Config** (Configuration panel)
- Discards all local changes
- Reloads official configuration from `data/dashboard-config.json`
- Use when you've made temporary edits and want to return to the official state

**Clear Local Changes** (Configuration panel)
- Removes custom layers and preferences
- Keeps the current visual state
- Useful to clean up without losing the current map view

⚠️ Both reset operations **cannot be undone** without exporting first

## CORS Issues

If you get CORS errors when loading layers:

1. **Check the server**: The server hosting the data must support CORS
2. **Use CORS-enabled sources**: Prefer public datasets that explicitly support CORS
3. **Local GeoJSON**: Place GeoJSON files in the `data/` folder and reference them locally
4. **CORS proxy**: As a last resort, use a CORS proxy, but this is not recommended for production

Example local GeoJSON:
```json
{
  "id": "local_data",
  "name": "Local Data",
  "type": "geojson",
  "url": "data/my-features.geojson",
  "visible": true
}
```

## Browser Support

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅ (responsive design)

## Architecture

### State Management
All state is managed in `AppState` object:
- Layers metadata and references
- Visibility and opacity states
- Layer ordering
- localStorage persistence

### Module Organization
- **MapModule**: Leaflet setup and map operations
- **LayersModule**: Layer loading and styling
- **UIModule**: User interactions
- **LegendModule**: Dynamic legend rendering
- **StorageModule**: localStorage persistence
- **SwipeModule**: Layer comparison
- **ChartsModule**: Indicators and statistics

### No External Dependencies
- Leaflet: Map visualization only
- Vanilla JavaScript: No frameworks
- HTML/CSS: Native browser features
- localStorage: Built-in browser API

## Performance Tips

- **Large GeoJSON files**: Dashboard handles moderate sizes well. For very large files (>10MB), consider:
  - Simplifying geometries
  - Splitting into multiple layers
  - Using tile layers instead of GeoJSON

- **Many layers**: Keeping 20+ layers visible may impact performance. Use layer visibility controls.

- **Mobile**: The responsive design works well on mobile, but reduce layer complexity for better performance.

## Known Limitations

- ❌ No offline mode yet
- ❌ No attribute filtering (planned for v2)
- ❌ No drawing/annotation tools (planned for v2)
- ❌ No temporal data support (planned for v2)
- ❌ WMS layers don't support all advanced capabilities
- ❌ Single-click popup (hover tooltips not yet supported)

## Public Service Testing Notes

The dashboard includes optional WMS test layers for geospatial testing purposes. These are **template and example layers** that require manual verification before use. All are disabled by default (`visible: false`).

### WMS Services Reference

All WMS services in this dashboard are configured through **data/layers-config.json only** (no hardcoded JavaScript). The following sources are used:

**Source:** [Public Geospatial Services Reference](https://github.com/...)

### Included WMS Test Layers

All layers listed here use reference endpoints and require layer name verification via GetCapabilities.

#### 1. INPE / TerraBrasilis

**Service:** TerraBrasilis Queimadas GeoServer  
**Endpoint:** `https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/wms`  
**GetCapabilities:** `https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/wms?service=WMS&request=GetCapabilities`  
**Status:** `template` - requires layer name verification  
**Group:** INPE / TerraBrasilis

**To enable this service:**
1. Visit the GetCapabilities URL above
2. Look for a `<Name>` element in the XML (e.g., `queimadas:historical_fires`)
3. Replace `"layers": "replace_with_layer_name_from_getcapabilities"` with the actual layer name
4. Restart the dashboard to load the updated configuration

#### 2. NASA GIBS

**Service:** NASA GIBS WMS (EPSG:3857)  
**Endpoint:** `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi`  
**GetCapabilities:** `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?service=WMS&request=GetCapabilities`  
**Status:** `template` - layers listed are from reference but require verification  
**Group:** NASA GIBS

**Included example layers:**
- `MODIS_Terra_CorrectedReflectance_TrueColor` - MODIS satellite true color
- `VIIRS_SNPP_Thermal_Anomalies_375m_All` - Fire detection from VIIRS

**CRS/Projection:** EPSG:3857 (Web Mercator) - compatible with Leaflet  
**Format:** PNG with transparency support

#### 3. Paraná GeoServer

**Service:** Paraná State GeoServer  
**Endpoint:** `https://geoserver.pr.gov.br/geoserver/wms`  
**GetCapabilities (v1.3.0):** `https://geoserver.pr.gov.br/geoserver/ows?request=GetCapabilities&service=WMS&version=1.3.0`  
**GetCapabilities (v1.1.1):** `https://geoserver.pr.gov.br/geoserver/ows?request=GetCapabilities&service=wms&version=1.1.1`  
**Status:** `template` - requires layer name verification  
**Group:** Government WMS

#### 4. INDE (National Spatial Data Infrastructure)

**Catalog:** `https://inde.gov.br/CatalogoGeoservicos`  
**Purpose:** Catalog/directory for discovering Brazilian WMS/WFS services  
**Status:** `template` - INDE is a discovery catalog, not a single WMS service  
**Group:** INDE

**To use INDE services:**
1. Browse the INDE Geoservices Catalog
2. Find a WMS service of interest
3. Copy the WMS endpoint
4. Verify with GetCapabilities
5. Create a new layer entry in data/layers-config.json

#### 5. GeoBases ES (Espírito Santo)

**Documentation:** `https://geobases.es.gov.br/tutoriais-ide-como-acessar-os-servicos-wms-e-wfs`  
**Status:** `template` - requires endpoint discovery and verification  
**Group:** Government WMS

**To find GeoBases ES services:**
1. Visit the tutorial/documentation link above
2. Identify available WMS endpoints
3. Test with GetCapabilities
4. Add verified layers to data/layers-config.json

### Adding a New WMS Layer

**Steps to verify and add a public WMS service:**

1. **Test GetCapabilities:**
   ```
   https://[wms-endpoint]?service=WMS&request=GetCapabilities
   ```

2. **Identify valid layer names:**
   - Download the XML response
   - Find `<Layer>` sections with `<Name>` elements
   - Copy the name exactly (case-sensitive)

3. **Verify CRS/Projection:**
   - Look for `<CRS>` or `<SRS>` elements
   - EPSG:3857 (Web Mercator) or EPSG:4326 (WGS84) are recommended
   - Other projections may cause tile loading issues

4. **Add to data/layers-config.json:**
   ```json
   {
     "id": "unique_layer_id",
     "name": "Human-Readable Name",
     "type": "wms",
     "url": "https://wms-endpoint",
     "layers": "verified_layer_name_from_getcapabilities",
     "format": "image/png",
     "transparent": true,
     "visible": false,
     "opacity": 0.8,
     "attribution": "Data Provider",
     "group": "Category Name",
     "status": "working",
     "description": "What this layer shows"
   }
   ```

5. **Set visible: false** until tested in the dashboard

6. **Reload the dashboard** and verify the layer loads without CORS errors

### Troubleshooting WMS Layers

**CORS Error:**
- WMS endpoint must have CORS headers enabled
- If CORS fails, the service cannot be used from a browser-based dashboard
- Check browser console for specific error messages

**Layer Not Found:**
- Verify layer name matches `<Name>` in GetCapabilities XML exactly
- Check case sensitivity
- Some WMS services use different parameter formats (1.1.1 vs 1.3.0)

**Tiles Not Loading:**
- Verify CRS/projection compatibility
- Some WMS services require specific parameter values
- Check WMS service documentation for requirements

**Map Appears Blank:**
- Check layer opacity setting (ensure > 0)
- Verify layer is not outside the current map extent
- Check WMS service status (may be temporarily offline)

## S3 GeoJSON Configuration & CORS

### Understanding CORS Restrictions

When loading GeoJSON files from Amazon S3 buckets, browsers enforce Cross-Origin Resource Sharing (CORS) policies for security. If an S3 bucket does not have CORS enabled, the browser will block fetch requests and display: **"S3 bucket CORS policy blocks requests from this domain."**

This is **expected behavior** and **not a bug**. The dashboard gracefully handles layer load failures and continues operating with other layers.

### Configuring S3 CORS

If you control an S3 bucket and want to serve GeoJSON files with CORS enabled:

1. **Access AWS S3 Console**
2. **Select your bucket**
3. **Go to Permissions → CORS configuration**
4. **Add the following CORS policy:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://github.io",
      "http://localhost:8000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Configuration Notes:**
- Replace `yourdomain.com` with your actual domain
- Add `https://yourdomain.github.io` if deploying to GitHub Pages
- `http://localhost:*` allows local development
- `AllowedMethods: ["GET", "HEAD"]` is sufficient for GeoJSON serving
- `MaxAgeSeconds: 3000` caches CORS preflight responses for 50 minutes

### Recommended Content-Type Headers

When uploading GeoJSON files to S3, set the Content-Type metadata:

**Recommended values:**
- `application/geo+json` - Standard GeoJSON MIME type (RFC 7946)
- `application/json` - Fallback if `geo+json` is not supported

**Via AWS CLI:**
```bash
aws s3 cp file.geojson s3://bucket-name/ --content-type "application/geo+json"
```

**Via AWS Console:**
1. Upload file
2. Click file name
3. Edit Metadata → Add key `Content-Type` with value `application/geo+json`

### Fallback Strategy: Local GeoJSON Files

If CORS configuration is not possible, store GeoJSON files locally in the project:

1. **Create a directory:**
   ```
   geojson/
   ├── layer1.geojson
   ├── layer2.geojson
   └── layer3.geojson
   ```

2. **Update layers-config.json with relative paths:**
   ```json
   {
     "id": "my_layer",
     "name": "My Layer",
     "type": "geojson",
     "url": "./geojson/layer1.geojson",
     "visible": false
   }
   ```

3. **Advantages:**
   - No CORS issues
   - Smaller file sizes (minification/compression)
   - Faster loading (local server)
   - No external dependencies

4. **Disadvantages:**
   - Repository size increases
   - Updates require repository commit
   - Not suitable for large datasets

### Diagnosing GeoJSON Load Failures

**In the browser, check the Layers panel:**
- If a layer shows "Cannot load layer: S3 bucket CORS policy..." it is a CORS issue
- The dashboard continues working with other available layers

**To diagnose further:**

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Try to enable a S3-based GeoJSON layer**
4. **Look for failed requests** with status `(blocked by browser)` or check Console for errors
5. **If CORS policy issue:**
   - S3 bucket needs CORS configuration
   - Or move GeoJSON to relative path as fallback

### Current GeoCARBON S3 Status

The dashboard includes ~46 GeoJSON layers from the GeoCARBON S3 bucket. These currently fail to load due to CORS restrictions:

```
S3 Bucket: geocarbon-geospatial.s3.amazonaws.com
Issue: CORS not configured for external domains
Status: Expected behavior, gracefully handled
Fallback: Layers can be downloaded and stored locally
```

If you wish to use these layers:
1. **Option A:** Contact GeoCARBON to enable CORS on their S3 bucket
2. **Option B:** Download GeoJSON files and store locally in `geojson/` directory
3. **Option C:** Update `url` fields in `layers-config.json` to point to a CORS-enabled mirror

### Testing WMS Layers in the Dashboard

1. Open the Geo Dashboard
2. Navigate to the **Layers** panel
3. Expand a service group (e.g., "NASA GIBS", "INPE / TerraBrasilis")
4. Toggle visibility for a layer
5. Observe the map for the layer to render
6. Check browser console (F12 → Console) for any CORS or WMS errors
7. Verify GetCapabilities URL matches configuration

### Current Layer Status

| Layer ID | Service | Status | Group |
|----------|---------|--------|-------|
| inpe_queimadas_wms | INPE TerraBrasilis | `template` | INPE / TerraBrasilis |
| nasa_gibs_modis_terra | NASA GIBS | `template` | NASA GIBS |
| nasa_gibs_viirs_fires | NASA GIBS | `template` | NASA GIBS |
| parana_geoserver_wms | Paraná GeoServer | `template` | Government WMS |
| inde_wms_template | INDE Catalog | `template` | INDE |
| geobases_es_wms | GeoBases ES | `template` | Government WMS |

**Note:** All layers are marked `template` because they require layer name verification via GetCapabilities before being marked as `working`.

### Basemaps

All required basemaps are present in **data/basemaps-config.json**:
- ✅ OpenStreetMap (OSM) - default
- ✅ Carto Light
- ✅ Carto Dark
- ✅ Esri World Imagery

These follow the reference file specification and require no additional configuration.

## Future Enhancements (v2)

- Attribute filtering
- Drawing and annotation tools
- Timeline/temporal data animation
- Point clustering
- Advanced exports (GeoJSON, CSV, Shapefile)
- Measure distance/area tools
- Localization (multilingual)
- Keyboard shortcuts

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this dashboard in your projects.

## Support

Having issues?

1. Check the browser console for error messages
2. Verify layer URLs are correct and CORS-enabled
3. Check `data/layers-config.json` syntax
4. Try opening in a different browser
5. Clear localStorage if experiencing issues: Open DevTools → Application → localStorage → Clear

## Credits

Built with:
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [CartoDB](https://carto.com/) - Basemaps
- [Esri](https://www.esri.com/) - Imagery and services
- [OpenStreetMap](https://www.openstreetmap.org/) - Base data

---

**Happy mapping! 🗺️**
