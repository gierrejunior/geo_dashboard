# Geo Dashboard - Architecture Guide

## Overview

Geo Dashboard is a modular, state-driven geospatial application with clear separation of concerns. The architecture prioritizes simplicity, maintainability, and performance.

## Core Principles

1. **No Framework Dependencies** - Pure vanilla JavaScript (ES6+)
2. **Modular Design** - Each concern has its own module
3. **State Management** - Centralized state in `AppState` object
4. **Single Source of Truth** - localStorage for persistence
5. **Unidirectional Data Flow** - UI updates follow state changes

## Module Architecture

### `storage.js` - Persistence Layer
**Responsibility**: Handle all localStorage operations

```
Storage.getTheme() → 'light' | 'dark'
Storage.setTheme(theme)
Storage.getLayers() → Array
Storage.addLayer(layer)
Storage.getLayerVisibility(layerId) → boolean
Storage.setLayerVisibility(layerId, visible)
Storage.getLayerOpacity(layerId) → number
Storage.setLayerOpacity(layerId, opacity)
Storage.getBookmarks() → Array
Storage.addBookmark(bookmark)
```

**Key Pattern**: All localStorage operations go through this module. No direct localStorage access elsewhere.

---

### `map.js` - Leaflet Integration
**Responsibility**: Initialize map, manage basemaps, handle map operations

```
MapModule.init() → map object
MapModule.getMap()
MapModule.getLayerGroup()
MapModule.addLayer(leafletLayer)
MapModule.removeLayer(leafletLayer)
MapModule.zoomToFeature(feature)
MapModule.zoomToLayer(layerId)
MapModule.setOpacity(leafletLayer, opacity)
```

**Key Pattern**: All Leaflet operations go through this module. It's the only place that directly manipulates the map.

**Basemaps Supported**:
- OpenStreetMap (free, fast)
- Carto Light (clean, professional)
- Carto Dark (dark theme)
- Esri World Imagery (satellite)

---

### `layers.js` - Layer Loading & Styling
**Responsibility**: Load different layer types, parse data, apply styles

```
LayersModule.loadLayer(config) → leafletLayer
LayersModule.loadGeoJSON(config)
LayersModule.loadRasterXYZ(config)
LayersModule.loadWMS(config)
LayersModule.getPopupContent(feature, popupFields)
LayersModule.getFeatureCount(leafletLayer)
```

**Supported Types**:
1. **GeoJSON**: Features from any source (points, lines, polygons)
2. **Raster XYZ**: Tile-based imagery (satellite, street maps)
3. **WMS**: OGC Web Map Service layers

**Style System**:
```json
{
  "style": {
    "color": "#hex",
    "weight": 2,
    "opacity": 0.8,
    "fillColor": "#hex",
    "fillOpacity": 0.5
  }
}
```

**Popup System**:
- Automatic popup generation from feature properties
- Configurable `popupFields` to limit displayed fields
- Escape HTML to prevent injection

---

### `legend.js` - Dynamic Legends
**Responsibility**: Generate and update legends based on visible layers

```
LegendModule.update()
LegendModule.renderLayerLegend(layer)
```

**Legend Types**:
1. **Color** - Array of {color, label} pairs
2. **Category** - Categorical data with colors
3. **Text** - Simple text items
4. **Default** - Layer name only

**Key Pattern**: Legend updates whenever layer visibility changes. Only visible layers show in legend.

---

### `charts.js` - Indicators & Statistics
**Responsibility**: Calculate and display key metrics

```
ChartsModule.updateIndicators()
```

**Metrics**:
- Total layers loaded
- Visible layers count
- Total features (GeoJSON only)

**Update Trigger**: Called whenever layers are added/removed or visibility changes.

---

### `swipe.js` - Layer Comparison Tool
**Responsibility**: Implement layer swipe/comparison feature

```
SwipeModule.enable()
SwipeModule.disable()
SwipeModule.updateLayerSelects()
SwipeModule.createSwipeSlider(layer1, layer2)
```

**Implementation**:
- Uses CSS `clip-path` for visual effect
- Mouse-draggable slider divider
- Select boxes to choose layers
- Only supports raster/WMS layers (not GeoJSON)

**Key Pattern**: Swipe state is separate from layer visibility. Enabling swipe doesn't hide other layers.

---

### `ui.js` - User Interface
**Responsibility**: Handle all user interactions and UI updates

**Submodules**:
1. **Theme Toggle** - Light/dark mode switching
2. **Sidebar Toggle** - Mobile-responsive sidebar
3. **Tab Navigation** - Layer/Search/Bookmarks tabs
4. **Layer Addition** - Form for adding new layers
5. **Search** - Feature search across all layers
6. **Bookmarks** - Save/restore map states
7. **Layer Controls** - List and control individual layers
   - Visibility toggle
   - Opacity slider
   - Reorder buttons (up/down)
   - **Rename button** - Opens rename dialog
   - Zoom to layer
   - Style editor (GeoJSON only)
   - Remove button
8. **Rename Dialog** - Edit layer display name and legend title
9. **Tool Buttons** - Swipe, reset, etc.

**Key Patterns**:
- All UI updates flow from state changes
- Event listeners trigger AppState updates
- No direct DOM manipulation except in render functions
- Validation on user input before processing

---

### `app.js` - State Management & Orchestration
**Responsibility**: Central state, coordinate all modules, initialize app

**AppState Object**:
```javascript
{
  layers: {
    'layer-id': {
      config,           // Original configuration
      leafletLayer,     // Leaflet object
      visible,          // Current visibility
      opacity,          // Current opacity
      order,            // Z-order for rendering
      _geodashboard_data,   // GeoJSON data (if applicable)
      // Friendly name fields
      originalName,     // Technical name from source
      displayName,      // Friendly name for UI (user-editable)
      legendTitle       // Custom legend title (user-editable)
    }
  }
}
```

**Friendly Names System**:

Each layer has four name-related fields for flexible display:

| Field | Purpose | Source | Example |
|-------|---------|--------|---------|
| `id` | Internal identifier (never changes) | config.id | `test_features` |
| `originalName` | Technical/source name (read-only) | config.originalName \| config.name \| config.id | `Test Features (Local)` |
| `displayName` | Friendly UI name (user-editable) | config.displayName \| config.name \| config.id | `Test Features` |
| `legendTitle` | Custom legend heading (user-editable) | config.legendTitle \| null | `Land Use Classes` |

**Display Priority**:
- Panel header: `displayName`
- Legend title: `legendTitle` > `displayName` > `originalName` > `id`
- Tooltips/hover: Show `originalName` for reference

**Persistence**:
- Default names: Stored in `data/layers-config.json`
- User overrides: Exported in `dashboard-config.json` under:
  - `layerDisplayNames`: Map of `layerId → displayName`
  - `layerLegendTitles`: Map of `layerId → legendTitle`

**Key Methods**:
```
AppState.loadConfigLayers()      // Load from data/layers-config.json
AppState.addLayer(config)        // Add layer to map & state
AppState.removeLayer(layerId)    // Remove layer
AppState.setLayerVisibility()    // Toggle visibility
AppState.setLayerOpacity()       // Adjust opacity
AppState.reorderLayer()          // Change z-order
AppState.reset()                 // Clear custom layers
```

**Initialization Flow**:
1. DOM ready
2. Initialize map
3. Initialize UI modules
4. Load config layers
5. Restore custom layers from localStorage
6. Restore visibility/opacity states
7. Update all indicators and legends

---

## Data Flow

### Adding a Layer (User clicks "Add Layer")
```
User Input
    ↓
UIModule.setupLayerAddition()
    ↓
Validation (name, URL, type)
    ↓
LayersModule.loadLayer(config)
    ↓
Parse GeoJSON / Create tile layer / Create WMS layer
    ↓
AppState.addLayer(config, leafletLayer)
    ↓
MapModule.addLayer(leafletLayer)
    ↓
Storage.addLayer(config)
    ↓
UIModule.updateLayersList()
ChartsModule.updateIndicators()
LegendModule.update()
```

### Toggling Layer Visibility
```
User clicks checkbox
    ↓
UIModule detects change
    ↓
AppState.setLayerVisibility(id, visible)
    ↓
Storage.setLayerVisibility(id, visible)
    ↓
MapModule.addLayer() OR MapModule.removeLayer()
    ↓
ChartsModule.updateIndicators()
LegendModule.update()
```

### Theme Toggle
```
User clicks theme button
    ↓
UIModule.setupThemeToggle()
    ↓
Set data-theme="dark" or "light" on <html>
    ↓
CSS variables update automatically (--color-* variables)
    ↓
Storage.setTheme(newTheme)
```

---

## Layer Configuration Schema

```json
{
  "id": "unique-id",                    // Required
  "name": "Display Name",               // Required
  "type": "geojson|raster-xyz|wms",    // Required
  "url": "https://...",                 // Required
  "visible": false,                     // Optional, default: false
  "opacity": 0.8,                       // Optional, default: 1
  "style": {                            // GeoJSON only, optional
    "color": "#3388ff",
    "weight": 2,
    "opacity": 0.8,
    "fillColor": "#3388ff",
    "fillOpacity": 0.5
  },
  "legend": {                           // Optional
    "type": "color|category|text",
    "colors": [{                        // For type: color
      "color": "#hex",
      "label": "Label"
    }],
    "categories": [{                    // For type: category
      "color": "#hex",
      "label": "Label"
    }],
    "items": ["Text1", "Text2"]        // For type: text
  },
  "popupFields": ["field1", "field2"],  // GeoJSON only, optional
  "attribution": "Source",              // Raster/WMS only
  "maxZoom": 18,                        // Raster/WMS only
  "minZoom": 0,                         // Raster/WMS only
  "layers": "layer-name",               // WMS only
  "transparent": true                   // WMS only
}
```

---

## Performance Considerations

### GeoJSON
- Handles ~10,000 features smoothly
- For larger datasets, consider:
  - Simplifying geometries
  - Splitting into multiple layers
  - Using raster tiles instead

### Rendering
- Layer reordering uses DOM manipulation (efficient for 20-30 layers)
- Opacity changes use Leaflet's native methods
- Visibility toggles add/remove layers from map

### Memory
- All layer data stored in AppState
- Large GeoJSON objects cached in `_geodashboard_data`
- No automatic cleanup (user must remove layers manually)

---

## Testing Checklist

- [ ] Map loads with default basemap (OpenStreetMap)
- [ ] Layers from config.json load successfully
- [ ] Layer checkbox toggles visibility
- [ ] Opacity slider works
- [ ] Layer reordering (up/down buttons) works
- [ ] Zoom to layer button works
- [ ] Remove layer button works
- [ ] Add layer via UI works
- [ ] Search finds features and zooms
- [ ] Clicking feature shows popup
- [ ] Save bookmark works
- [ ] Load bookmark restores map state
- [ ] Layer swipe comparison works
- [ ] Theme toggle switches light/dark
- [ ] Page refresh restores custom layers
- [ ] Reset button clears everything
- [ ] Mobile responsive (sidebar collapses)
- [ ] CORS errors handled gracefully
- [ ] Legend updates with visible layers

---

## File Sizes (Optimized)

- index.html: ~6 KB
- css/style.css: ~20 KB
- js/app.js: ~8 KB
- js/ui.js: ~18 KB
- js/layers.js: ~8 KB
- js/map.js: ~6 KB
- Other JS files: ~4 KB each
- **Total HTML/CSS/JS: ~75 KB** (before gzip compression)

---

## Browser APIs Used

- **localStorage**: Session persistence
- **Fetch API**: Load remote data
- **CSS Variables**: Theme switching
- **Flexbox**: Layout
- **EventListeners**: User interactions
- **DOM API**: Element manipulation
- **URL API**: URL validation

---

## Future Architecture Changes (v2)

- Add attribute filtering (separate FilterModule)
- Drawing tools (DrawModule with Leaflet.Draw)
- Timeline/temporal data (TimelineModule)
- Clustering (ClusterModule with Leaflet.MarkerCluster)
- Advanced export (ExportModule)
- Keyboard shortcuts (ShortcutModule)

All new modules would follow the same pattern:
1. Independent responsibility
2. Expose clean API
3. Update AppState for persistence
4. Trigger UI updates via observers
