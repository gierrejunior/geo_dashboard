/**
 * App Module - Main application orchestration
 * Manages global state and coordinates all modules
 */

const AppState = {
    layers: {}, // { id: { config, leafletLayer, visible, opacity, order, status } }
    layerCounter: 0,
    configLayers: [],
    configErrors: {},
    buffers: [], // { id, sourceLayer, distance, units, style, geoJSON, leafletLayer }

    // =====================================================
    // Error Handling Helpers
    // =====================================================

    getReadableErrorMessage(error, layerConfig) {
        const errorStr = error.message || String(error);
        const url = layerConfig?.url || '';
        const isS3Url = url.includes('s3.amazonaws.com') || url.includes('.s3.');

        // Network/fetch errors
        if (errorStr.includes('Failed to fetch') || errorStr.includes('NetworkError')) {
            if (isS3Url) {
                return 'Cannot load layer: S3 bucket CORS policy blocks requests from this domain. The bucket may not have CORS enabled, or may not allow this site. See README for configuration options.';
            }
            return 'Cannot load layer: Network error or URL unreachable (may be blocked by CORS policy)';
        }
        if (errorStr.includes('404') || errorStr.includes('Not Found')) {
            return 'Cannot load layer: URL not found (404 error)';
        }
        if (errorStr.includes('401') || errorStr.includes('403') || errorStr.includes('Unauthorized')) {
            return 'Cannot load layer: Access denied by server (authentication/permission error)';
        }
        if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
            return 'Cannot load layer: Server error. The service may be temporarily down';
        }
        if (errorStr.includes('timeout') || errorStr.includes('Timeout')) {
            return 'Cannot load layer: Request timed out (server took too long to respond)';
        }

        // GeoJSON errors
        if (errorStr.includes('JSON') || errorStr.includes('SyntaxError')) {
            return 'Cannot load layer: Invalid GeoJSON format (check that URL returns valid JSON)';
        }
        if (errorStr.includes('Unexpected end of JSON')) {
            return 'Cannot load layer: Incomplete or corrupted GeoJSON data';
        }

        // WMS errors
        if (layerConfig?.type === 'wms' && errorStr.includes('layers')) {
            return 'Cannot load WMS layer: "layers" parameter is required in layer configuration';
        }

        // Generic layer type
        if (errorStr.includes('Unknown layer type')) {
            return `Cannot load layer: Unknown layer type "${layerConfig?.type}"`;
        }

        // Fallback: return shortened error message
        return `Cannot load layer: ${errorStr.substring(0, 100)}`;
    },

    // =====================================================
    // Layer Management
    // =====================================================

    async loadConfigLayers() {
        const { layers, errors } = await ConfigModule.loadLayersConfig();
        this.configLayers = layers;
        this.configErrors = errors;

        if (Object.keys(errors).length > 0) {
            console.warn('Config validation errors:', errors);
        }

        for (const layerConfig of layers) {
            try {
                await this.addLayer(layerConfig);
            } catch (error) {
                console.warn(`Failed to load layer "${layerConfig.name}":`, error);
                this.layers[layerConfig.id].status = 'error';
                this.layers[layerConfig.id].error = this.getReadableErrorMessage(error, layerConfig);
            }
        }
    },

    async addLayer(config, leafletLayer = null) {
        const id = config.id;
        const isConfigLayer = !config.id.startsWith('custom_');

        // Create layer entry with loading status
        this.layers[id] = {
            config: config,
            leafletLayer: null,
            visible: isConfigLayer ? config.visible !== false : true,
            opacity: config.opacity || 1,
            order: Object.keys(this.layers).length,
            status: 'loading',
            error: null,
            _geodashboard_data: null,
            // Friendly name fields
            originalName: config.originalName || config.name || config.id,
            displayName: config.displayName || config.name || config.id,
            legendTitle: config.legendTitle || null
        };

        try {
            // Load Leaflet layer if not provided
            if (!leafletLayer) {
                leafletLayer = await LayersModule.loadLayer(config);
            }

            // Get stored visibility and opacity
            const visible = this.layers[id].visible;
            const opacity = this.layers[id].opacity;

            // Update layer reference
            this.layers[id].leafletLayer = leafletLayer;
            this.layers[id]._geodashboard_data = leafletLayer._geodashboard_data;
            this.layers[id].status = 'loaded';

            // Add to map with correct layer type for pane assignment
            MapModule.addLayer(leafletLayer, config.type);

            // Set initial visibility and opacity
            MapModule.setOpacity(leafletLayer, opacity);
            if (!visible) {
                MapModule.removeLayer(leafletLayer);
            }

            // Setup popups for GeoJSON
            if (config.type === 'geojson') {
                LayersModule.setupLayerPopups(leafletLayer, config);
            }

            // Save custom layers to localStorage
            if (!isConfigLayer) {
                Storage.addLayer(config);
            }

            // Update UI and indicators
            UIModule.updateLayersList();
            ChartsModule.updateIndicators();
            LegendModule.update();
            SwipeModule.updateLayerSelects();

            return id;
        } catch (error) {
            console.error('Error adding layer:', error);
            this.layers[id].status = 'error';
            this.layers[id].error = this.getReadableErrorMessage(error, config);
            this.layers[id].leafletLayer = null;

            // Update UI to show error
            UIModule.updateLayersList();
            ChartsModule.updateIndicators();

            throw error;
        }
    },

    removeLayer(layerId) {
        const layer = this.layers[layerId];
        if (!layer) return;

        // Remove from map
        MapModule.removeLayer(layer.leafletLayer);

        // Remove from state
        delete this.layers[layerId];

        // Remove from localStorage if custom
        if (layerId.startsWith('custom_')) {
            Storage.removeLayer(layerId);
        }

        // Update UI
        UIModule.updateLayersList();
        ChartsModule.updateIndicators();
        LegendModule.update();
        SwipeModule.updateLayerSelects();
    },

    setLayerVisibility(layerId, visible) {
        const layer = this.layers[layerId];
        if (!layer) return;

        layer.visible = visible;

        if (visible) {
            MapModule.addLayer(layer.leafletLayer);
        } else {
            MapModule.removeLayer(layer.leafletLayer);
        }

        ChartsModule.updateIndicators();
        LegendModule.update();
    },

    setLayerOpacity(layerId, opacity) {
        const layer = this.layers[layerId];
        if (!layer) return;

        layer.opacity = opacity;
        MapModule.setOpacity(layer.leafletLayer, opacity);
    },

    reorderLayer(layerId, direction) {
        const layers = Object.values(this.layers).sort((a, b) => (b.order || 0) - (a.order || 0));
        const currentIndex = layers.findIndex(l => l.config.id === layerId);

        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= layers.length) return;

        // Swap order values
        const currentOrder = layers[currentIndex].order || 0;
        const targetOrder = layers[newIndex].order || 0;

        layers[currentIndex].order = targetOrder;
        layers[newIndex].order = currentOrder;

        // Re-add layers to map in correct order
        layers.forEach(layer => {
            MapModule.removeLayer(layer.leafletLayer);
        });

        layers.sort((a, b) => (b.order || 0) - (a.order || 0)).forEach(layer => {
            if (layer.visible) {
                MapModule.addLayer(layer.leafletLayer);
            }
        });

        Storage.setLayerOrder(layers.map(l => l.config.id));
    },

    reset() {
        // Remove all custom layers
        Object.keys(this.layers)
            .filter(id => id.startsWith('custom_'))
            .forEach(id => this.removeLayer(id));
    }
};

// =====================================================
// Application Initialization
// =====================================================

async function initializeApp() {
    try {
        // =====================================================
        // 1. Load configuration files (official project state)
        // =====================================================
        const dashboardConfig = await ConfigModule.loadDashboardConfig();
        const basemapsConfig = await ConfigModule.loadBasemapsConfig();

        // =====================================================
        // 1b. Check if any layer requires PMTiles
        // =====================================================
        const layersConfig = await ConfigModule.loadLayersConfig().catch(() => ({ layers: [] }));
        const hasPMTilesLayers = layersConfig.layers && layersConfig.layers.some(layer => layer.type === 'pmtiles');

        // Wait for PMTiles library only if needed
        if (hasPMTilesLayers) {
            console.log('[app.js] Detectadas camadas PMTiles - aguardando carregamento da biblioteca...');
            let pmtilesReady = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 100; // 10 seconds max

            while (!pmtilesReady && waitAttempts < maxWaitAttempts) {
                if (window._pmtilesReady) {
                    pmtilesReady = true;
                    console.log('[app.js] ✓ Biblioteca PMTiles carregada com sucesso');
                } else if (window._pmtilesError) {
                    console.error('[app.js] ✗ Erro ao carregar PMTiles:', window._pmtilesError);
                    console.warn('[app.js] PMTiles não estará disponível - outras camadas continuarão funcionando');
                    break;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitAttempts++;
                }
            }

            if (!pmtilesReady && !window._pmtilesError) {
                console.warn('[app.js] PMTiles não carregou no tempo esperado (máx 10s) - pode haver problemas com camadas PMTiles');
            }
        } else {
            console.log('[app.js] Nenhuma camada PMTiles detectada - pulando aguardo de biblioteca');
        }

        // =====================================================
        // 2. Initialize map with basemaps and initial position
        // =====================================================
        const initialBasemapId = dashboardConfig.activeBasemap;
        await MapModule.init(basemapsConfig, initialBasemapId);
        const map = MapModule.getMap();
        map.setView(dashboardConfig.initialMap.center, dashboardConfig.initialMap.zoom);

        // =====================================================
        // 3. Initialize UI modules
        // =====================================================
        UIModule.init();
        LegendModule.init();
        ChartsModule.init();
        SwipeModule.init();

        // =====================================================
        // 4. Apply theme (from localStorage if set, otherwise dashboard config, default to dark)
        // localStorage theme is a browser preference, not part of official config
        // =====================================================
        const theme = Storage.getTheme() || dashboardConfig.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        // =====================================================
        // 5. Load configuration layers from layers-config.json
        // =====================================================
        await AppState.loadConfigLayers();

        // =====================================================
        // 6. Load custom layers from localStorage (temporary layers added by URL)
        // These are separate from official config layers
        // =====================================================
        const customLayers = Storage.getLayers();
        for (const config of customLayers) {
            try {
                await AppState.addLayer(config);
            } catch (error) {
                console.warn(`Failed to restore custom layer "${config.name}":`, error);
            }
        }

        // =====================================================
        // 7. Apply dashboard-config.json state (official layer settings)
        // dashboard-config.json is the source of truth for layer visibility/opacity/styles
        // =====================================================
        Object.entries(AppState.layers).forEach(([id, layer]) => {
            if (!layer.leafletLayer) return; // Skip layers with errors

            // For config layers: use dashboard-config.json state
            if (!id.startsWith('custom_')) {
                const dashboardVisible = dashboardConfig.layers?.visibleLayers?.[id];
                const dashboardOpacity = dashboardConfig.layers?.layerOpacity?.[id];

                if (dashboardVisible !== undefined) {
                    layer.visible = dashboardVisible;
                }
                if (dashboardOpacity !== undefined) {
                    layer.opacity = dashboardOpacity;
                }

                // Apply style overrides from dashboard-config if present
                const dashboardStyle = dashboardConfig.layerStyles?.[id];
                if (dashboardStyle && layer.config.type === 'geojson') {
                    layer.customStyle = dashboardStyle;
                    LayersModule.reapplyStyle(layer.leafletLayer, dashboardStyle);
                }
            }

            // Apply layer state to map
            MapModule.setOpacity(layer.leafletLayer, layer.opacity);
            if (!layer.visible) {
                MapModule.removeLayer(layer.leafletLayer);
            }
        });

        // =====================================================
        // 7b. Apply friendly name overrides from dashboard-config.json
        // =====================================================
        if (dashboardConfig.layerDisplayNames) {
            Object.entries(dashboardConfig.layerDisplayNames).forEach(([id, displayName]) => {
                if (AppState.layers[id]) {
                    AppState.layers[id].displayName = displayName;
                }
            });
        }
        if (dashboardConfig.layerLegendTitles) {
            Object.entries(dashboardConfig.layerLegendTitles).forEach(([id, legendTitle]) => {
                if (AppState.layers[id]) {
                    AppState.layers[id].legendTitle = legendTitle;
                }
            });
        }

        // =====================================================
        // 8. Restore buffers from dashboard-config
        // =====================================================
        if (dashboardConfig.buffers && Array.isArray(dashboardConfig.buffers)) {
            await BufferModule.restoreBuffersFromConfig(dashboardConfig.buffers);
        }

        // =====================================================
        // 9. Update UI
        // =====================================================
        UIModule.updateLayersList();
        ChartsModule.updateIndicators();
        LegendModule.update();

        // Show config errors if any
        if (Object.keys(AppState.configErrors).length > 0) {
            console.warn('Some layers failed validation:', AppState.configErrors);
        }

        console.log('Geo Dashboard initialized successfully');
        console.log('Official state loaded from: data/dashboard-config.json, data/basemaps-config.json, data/layers-config.json');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error loading dashboard. Check browser console for details.');
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
