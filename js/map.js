/**
 * Map Module - Initialize and manage Leaflet map
 */

const MapModule = {
    map: null,
    baseLayers: {},
    basemapsConfig: [],
    layerGroup: L.layerGroup(),
    activeBasemapId: null,

    async init(basemapsConfig = [], initialBasemapId = null) {
        // Create map centered on world
        this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            maxZoom: 19,
            zoomControl: true,
            attributionControl: true
        });

        // Create custom Leaflet panes for proper z-index stacking
        // basemaps stay at lowest level, UI controls above all layers
        const panes = this.map.getPanes();
        const createPane = (name, zIndex) => {
            if (!panes[name]) {
                this.map.createPane(name);
            }
            panes[name].style.zIndex = zIndex;
        };

        createPane('rasterPane', 300);
        createPane('wmsPane', 350);
        createPane('vectorPane', 400);

        // Initialize layer group - add to vectorPane by default
        this.layerGroup.addTo(this.map);

        // Load basemaps from config
        this.basemapsConfig = basemapsConfig;
        this.defineBaseLayers(basemapsConfig);

        // Add initial basemap by ID or use default
        let basemapToLoad = basemapsConfig.find(bm => bm.id === initialBasemapId);
        if (!basemapToLoad) {
            basemapToLoad = basemapsConfig.find(bm => bm.default);
        }
        if (!basemapToLoad) {
            basemapToLoad = basemapsConfig[0];
        }

        if (basemapToLoad && this.baseLayers[basemapToLoad.name]) {
            this.baseLayers[basemapToLoad.name].addTo(this.map);
            this.activeBasemapId = basemapToLoad.id;
        }

        // Add basemap control
        L.control.layers(this.baseLayers, {}, { position: 'topright' }).addTo(this.map);

        return this.map;
    },

    defineBaseLayers(basemapsConfig) {
        this.baseLayers = {};

        basemapsConfig.forEach(bm => {
            if (bm.type === 'xyz') {
                this.baseLayers[bm.name] = L.tileLayer(bm.url, {
                    attribution: bm.attribution || '',
                    maxZoom: bm.maxZoom || 19
                });
            }
        });
    },

    getMap() {
        return this.map;
    },

    getLayerGroup() {
        return this.layerGroup;
    },

    addLayer(leafletLayer, layerType = 'vector') {
        this.layerGroup.addLayer(leafletLayer);
        this.assignLayerPane(leafletLayer, layerType);
    },

    assignLayerPane(leafletLayer, layerType) {
        const paneMap = {
            'raster': 'rasterPane',
            'wms': 'wmsPane',
            'vector': 'vectorPane',
            'geojson': 'vectorPane'
        };

        const paneName = paneMap[layerType] || 'vectorPane';
        if (leafletLayer.setPane) {
            leafletLayer.setPane(paneName);
        } else if (leafletLayer.eachLayer) {
            // For layer groups, assign pane to each child
            leafletLayer.eachLayer(layer => {
                if (layer.setPane) {
                    layer.setPane(paneName);
                }
            });
        }
    },

    removeLayer(leafletLayer) {
        this.layerGroup.removeLayer(leafletLayer);
    },

    zoomToFeature(feature) {
        if (!feature) return;

        let bounds;

        if (feature.getBounds) {
            // Layer with getBounds
            bounds = feature.getBounds();
        } else if (feature.geometry && feature.geometry.type === 'Point') {
            // GeoJSON Point
            bounds = L.latLngBounds([
                [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
            ]);
        } else {
            // Try GeoJSON FeatureCollection or Feature
            try {
                const geoJsonLayer = L.geoJSON(feature);
                bounds = geoJsonLayer.getBounds();
            } catch (e) {
                console.warn('Cannot zoom to feature:', e);
                return;
            }
        }

        if (bounds && bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    },

    zoomToLayer(layerId) {
        const layer = AppState.layers[layerId];
        if (!layer || !layer.leafletLayer) return;

        const leafletLayer = layer.leafletLayer;
        if (leafletLayer.getBounds) {
            const bounds = leafletLayer.getBounds();
            if (bounds && bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    },

    setOpacity(leafletLayer, opacity) {
        if (!leafletLayer) return;

        // For GeoJSON layers
        if (leafletLayer.setStyle) {
            leafletLayer.setStyle({ fillOpacity: opacity, opacity: opacity });
        }

        // For tile layers
        if (leafletLayer.setOpacity) {
            leafletLayer.setOpacity(opacity);
        }

        // For feature groups with multiple layers
        if (leafletLayer.eachLayer) {
            leafletLayer.eachLayer(layer => {
                if (layer.setStyle) {
                    layer.setStyle({ fillOpacity: opacity, opacity: opacity });
                }
                if (layer.setOpacity) {
                    layer.setOpacity(opacity);
                }
            });
        }
    },

    getActiveBasemapId() {
        return this.activeBasemapId;
    },

    setActiveBasemap(basemapId) {
        const basemap = this.basemapsConfig.find(bm => bm.id === basemapId);
        if (!basemap || !this.baseLayers[basemap.name]) return;

        // Remove all existing basemap layers
        Object.values(this.baseLayers).forEach(layer => {
            this.map.removeLayer(layer);
        });

        // Add the new basemap
        this.baseLayers[basemap.name].addTo(this.map);
        this.activeBasemapId = basemapId;
    }
};
