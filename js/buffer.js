/**
 * Buffer Module - Geospatial buffer operations using Turf.js
 * Handles creating and managing buffer layers around GeoJSON features
 */

const BufferModule = {
    // =====================================================
    // Buffer Creation & Management
    // =====================================================

    async createBuffer(sourceLayerId, distance, units = 'kilometers') {
        const sourceLayer = AppState.layers[sourceLayerId];
        if (!sourceLayer || !sourceLayer.leafletLayer || sourceLayer.config.type !== 'geojson') {
            console.error('Invalid source layer for buffer');
            return null;
        }

        try {
            const sourceData = sourceLayer._geodashboard_data;
            if (!sourceData || !sourceData.features) {
                console.error('No features found in source layer');
                return null;
            }

            // Create buffer using Turf.js
            const bufferedFeatures = [];
            sourceData.features.forEach(feature => {
                try {
                    const buffered = turf.buffer(feature, distance, { units });
                    if (buffered) {
                        bufferedFeatures.push(buffered);
                    }
                } catch (error) {
                    console.warn(`Failed to buffer feature: ${error.message}`);
                }
            });

            if (bufferedFeatures.length === 0) {
                console.error('Buffer operation produced no features');
                return null;
            }

            // Create FeatureCollection from buffered features
            const bufferedGeoJSON = {
                type: 'FeatureCollection',
                features: bufferedFeatures
            };

            return bufferedGeoJSON;
        } catch (error) {
            console.error('Error creating buffer:', error);
            return null;
        }
    },

    createBufferLayer(bufferedGeoJSON, style = null) {
        if (!bufferedGeoJSON || !bufferedGeoJSON.features) {
            return null;
        }

        const defaultStyle = {
            color: '#ff9800',
            fillColor: '#ffb74d',
            fillOpacity: 0.2,
            opacity: 0.8,
            weight: 2,
            dashArray: '5, 5'
        };

        const layerStyle = style || defaultStyle;

        const layer = L.geoJSON(bufferedGeoJSON, {
            style: layerStyle,
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 6,
                    ...layerStyle
                });
            }
        });

        layer._geodashboard_type = 'buffer';
        layer._geodashboard_data = bufferedGeoJSON;
        layer._geodashboard_featureCount = bufferedGeoJSON.features.length;

        return layer;
    },

    async addBufferLayer(bufferId, sourceLayerId, distance, units = 'kilometers', style = null) {
        try {
            // Create the buffer geometry
            const bufferedGeoJSON = await this.createBuffer(sourceLayerId, distance, units);
            if (!bufferedGeoJSON) {
                console.error('Failed to create buffer geometry');
                return null;
            }

            // Create the Leaflet layer
            const leafletLayer = this.createBufferLayer(bufferedGeoJSON, style);
            if (!leafletLayer) {
                console.error('Failed to create buffer layer');
                return null;
            }

            // Create buffer entry in AppState
            const bufferEntry = {
                id: bufferId,
                sourceLayer: sourceLayerId,
                distance,
                units,
                style: style || {
                    color: '#ff9800',
                    fillColor: '#ffb74d',
                    fillOpacity: 0.2
                },
                geoJSON: bufferedGeoJSON,
                leafletLayer,
                visible: true
            };

            AppState.buffers.push(bufferEntry);

            // Add to map
            MapModule.addLayer(leafletLayer);

            // Update UI
            UIModule.updateLayersList();

            return bufferEntry;
        } catch (error) {
            console.error('Error adding buffer layer:', error);
            return null;
        }
    },

    removeBufferLayer(bufferId) {
        const index = AppState.buffers.findIndex(b => b.id === bufferId);
        if (index === -1) return false;

        const buffer = AppState.buffers[index];

        // Remove from map
        if (buffer.leafletLayer) {
            MapModule.removeLayer(buffer.leafletLayer);
        }

        // Remove from state
        AppState.buffers.splice(index, 1);

        // Update UI
        UIModule.updateLayersList();

        return true;
    },

    setBufferVisibility(bufferId, visible) {
        const buffer = AppState.buffers.find(b => b.id === bufferId);
        if (!buffer) return;

        buffer.visible = visible;

        if (visible && buffer.leafletLayer) {
            MapModule.addLayer(buffer.leafletLayer);
        } else if (!visible && buffer.leafletLayer) {
            MapModule.removeLayer(buffer.leafletLayer);
        }
    },

    setBufferOpacity(bufferId, opacity) {
        const buffer = AppState.buffers.find(b => b.id === bufferId);
        if (!buffer || !buffer.leafletLayer) return;

        MapModule.setOpacity(buffer.leafletLayer, opacity);
    },

    updateBufferStyle(bufferId, style) {
        const buffer = AppState.buffers.find(b => b.id === bufferId);
        if (!buffer || !buffer.leafletLayer) return;

        buffer.style = style;
        StylesModule.applySingleStyle(buffer.leafletLayer, style);
    },

    // =====================================================
    // Buffer Export (for dashboard-config.json)
    // =====================================================

    exportBuffers() {
        return AppState.buffers.map(buffer => ({
            id: buffer.id,
            sourceLayer: buffer.sourceLayer,
            distance: buffer.distance,
            units: buffer.units,
            style: buffer.style
        }));
    },

    // =====================================================
    // Buffer Restoration (from dashboard-config.json)
    // =====================================================

    async restoreBuffersFromConfig(bufferConfigs = []) {
        if (!Array.isArray(bufferConfigs)) return;

        for (const config of bufferConfigs) {
            try {
                await this.addBufferLayer(
                    config.id,
                    config.sourceLayer,
                    config.distance,
                    config.units || 'kilometers',
                    config.style
                );
            } catch (error) {
                console.warn(`Failed to restore buffer ${config.id}:`, error);
            }
        }
    }
};
