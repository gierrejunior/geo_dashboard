// ConfigModule - Load and validate JSON configurations
const ConfigModule = (() => {
  // Load JSON from file with error handling
  async function loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to load ${url}:`, error);
      throw error;
    }
  }

  // Validate layer config
  function validateLayer(layer) {
    const errors = [];

    // Required fields
    if (!layer.id) errors.push('Missing required field: id');
    if (!layer.name) errors.push('Missing required field: name');
    if (!layer.type) errors.push('Missing required field: type');
    if (!layer.url) errors.push('Missing required field: url');

    // Validate type
    const validTypes = ['geojson', 'raster-xyz', 'wms', 'pmtiles'];
    if (layer.type && !validTypes.includes(layer.type)) {
      errors.push(`Invalid type: ${layer.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // WMS-specific validation
    if (layer.type === 'wms' && !layer.layers) {
      errors.push('WMS layer missing required field: layers');
    }

    return errors;
  }

  // Normalize layer config with defaults
  function normalizeLayer(layer) {
    const normalized = {
      id: layer.id,
      name: layer.name,
      group: layer.group || 'Other Layers',
      description: layer.description || '',
      type: layer.type,
      url: layer.url,
      visible: layer.visible !== undefined ? layer.visible : false,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      attribution: layer.attribution || '',
      minZoom: layer.minZoom !== undefined ? layer.minZoom : 0,
      maxZoom: layer.maxZoom !== undefined ? layer.maxZoom : 28,
      legend: layer.legend || [],
      popupFields: layer.popupFields || [],
      searchableFields: layer.searchableFields || layer.popupFields || [],
      ...(layer.bounds && { bounds: layer.bounds })
    };

    // GeoJSON-specific fields
    if (layer.type === 'geojson') {
      normalized.style = layer.style || {
        color: '#3388ff',
        fillColor: '#3388ff',
        weight: 1,
        fillOpacity: 0.5
      };
    }

    // WMS-specific fields
    if (layer.type === 'wms') {
      normalized.layers = layer.layers;
      normalized.format = layer.format || 'image/png';
      normalized.transparent = layer.transparent !== undefined ? layer.transparent : true;
      if (layer.version) normalized.version = layer.version;
      if (layer.styles) normalized.styles = layer.styles;
      if (layer.crs) normalized.crs = layer.crs;
    }

    // Raster XYZ-specific fields
    if (layer.type === 'raster-xyz') {
      normalized.maxNativeZoom = layer.maxNativeZoom !== undefined ? layer.maxNativeZoom : layer.maxZoom || 28;
      if (layer.tms) normalized.tms = layer.tms;
      if (layer.subdomains) normalized.subdomains = layer.subdomains;
      if (layer.tileSize !== undefined) normalized.tileSize = layer.tileSize;
    }

    return normalized;
  }

  // Load and validate layers config
  async function loadLayersConfig(url = 'data/layers-config.json') {
    try {
      const rawLayers = await loadJSON(url);

      if (!Array.isArray(rawLayers)) {
        throw new Error('Config must be an array of layers');
      }

      const layers = [];
      const errors = {};

      rawLayers.forEach((layer, index) => {
        const validationErrors = validateLayer(layer);
        if (validationErrors.length > 0) {
          errors[`Layer ${index} (${layer.id || 'unknown'})`] = validationErrors;
        } else {
          try {
            layers.push(normalizeLayer(layer));
          } catch (error) {
            errors[`Layer ${index} (${layer.id})`] = [error.message];
          }
        }
      });

      return { layers, errors };
    } catch (error) {
      console.error('Failed to load layers config:', error);
      return { layers: [], errors: { 'config.json': [error.message] } };
    }
  }

  // Normalize basemap config with defaults
  function normalizeBasemap(basemap) {
    return {
      id: basemap.id,
      name: basemap.name,
      type: basemap.type,
      url: basemap.url,
      default: basemap.default || false,
      attribution: basemap.attribution || '',
      minZoom: basemap.minZoom !== undefined ? basemap.minZoom : 0,
      maxZoom: basemap.maxZoom !== undefined ? basemap.maxZoom : 28,
      maxNativeZoom: basemap.maxNativeZoom !== undefined ? basemap.maxNativeZoom : basemap.maxZoom || 28,
      ...(basemap.subdomains && { subdomains: basemap.subdomains }),
      ...(basemap.tms && { tms: basemap.tms })
    };
  }

  // Load basemaps config
  async function loadBasemapsConfig(url = 'data/basemaps-config.json') {
    try {
      const basemaps = await loadJSON(url);

      if (!Array.isArray(basemaps)) {
        throw new Error('Basemaps config must be an array');
      }

      // Validate and normalize basemaps
      const validated = basemaps
        .filter(bm => {
          if (!bm.id || !bm.name || !bm.type || !bm.url) {
            console.warn('Invalid basemap config:', bm);
            return false;
          }
          return true;
        })
        .map(bm => normalizeBasemap(bm));

      return validated;
    } catch (error) {
      console.error('Failed to load basemaps config:', error);
      // Return OSM fallback
      return [
        {
          id: 'osm-fallback',
          name: 'OpenStreetMap',
          type: 'xyz',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          default: true,
          attribution: '© OpenStreetMap contributors',
          minZoom: 0,
          maxZoom: 19,
          maxNativeZoom: 19,
          subdomains: 'abc'
        }
      ];
    }
  }

  // Group layers by category
  function groupLayers(layers) {
    const grouped = {};

    layers.forEach(layer => {
      const group = layer.group || 'Other Layers';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(layer);
    });

    return grouped;
  }

  // Load dashboard config with defaults
  async function loadDashboardConfig(url = 'data/dashboard-config.json') {
    try {
      const config = await loadJSON(url);

      // Validate required properties
      const defaults = {
        title: 'Geo Dashboard',
        description: '',
        initialMap: { center: [20, 0], zoom: 2 },
        activeBasemap: 'osm',
        theme: 'light',
        layers: { visibleLayers: {}, layerOrder: [], layerOpacity: {} },
        swipe: { enabled: false, leftLayer: null, rightLayer: null },
        legend: { collapsed: false },
        panels: { activeTab: 'layers', layersCollapsed: false, indicatorsCollapsed: false },
        bookmarks: []
      };

      // Handle legacy swipe config (layer1/layer2 -> leftLayer/rightLayer)
      const swipeConfig = config.swipe || {};
      const normalizedSwipe = {
        enabled: swipeConfig.enabled || false,
        leftLayer: swipeConfig.leftLayer || swipeConfig.layer1 || null,
        rightLayer: swipeConfig.rightLayer || swipeConfig.layer2 || null
      };

      return {
        title: config.title || defaults.title,
        description: config.description || defaults.description,
        initialMap: config.initialMap || defaults.initialMap,
        activeBasemap: config.activeBasemap || defaults.activeBasemap,
        theme: config.theme || defaults.theme,
        layers: {
          visibleLayers: config.layers?.visibleLayers || {},
          layerOrder: config.layers?.layerOrder || [],
          layerOpacity: config.layers?.layerOpacity || {}
        },
        swipe: normalizedSwipe,
        legend: {
          collapsed: config.legend?.collapsed !== undefined ? config.legend.collapsed : defaults.legend.collapsed
        },
        panels: {
          activeTab: config.panels?.activeTab || defaults.panels.activeTab,
          layersCollapsed: config.panels?.layersCollapsed !== undefined ? config.panels.layersCollapsed : defaults.panels.layersCollapsed,
          indicatorsCollapsed: config.panels?.indicatorsCollapsed !== undefined ? config.panels.indicatorsCollapsed : defaults.panels.indicatorsCollapsed
        },
        bookmarks: Array.isArray(config.bookmarks) ? config.bookmarks : []
      };
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
      // Return safe defaults
      return {
        title: 'Geo Dashboard',
        description: '',
        initialMap: { center: [20, 0], zoom: 2 },
        activeBasemap: 'osm',
        theme: 'light',
        layers: { visibleLayers: {}, layerOrder: [], layerOpacity: {} },
        swipe: { enabled: false, leftLayer: null, rightLayer: null },
        legend: { collapsed: false },
        panels: { activeTab: 'layers', layersCollapsed: false, indicatorsCollapsed: false },
        bookmarks: []
      };
    }
  }

  return {
    loadJSON,
    loadLayersConfig,
    loadBasemapsConfig,
    loadDashboardConfig,
    validateLayer,
    normalizeLayer,
    groupLayers
  };
})();
