/**
 * Layers Module - Load and manage different layer types
 * Supports: GeoJSON, Raster XYZ, WMS
 */

const LayersModule = {
    async fetchWithTimeout(url, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    },

    async loadLayer(config) {
        try {
            let leafletLayer;

            switch (config.type) {
                case 'geojson':
                    leafletLayer = await this.loadGeoJSON(config);
                    break;
                case 'raster-xyz':
                    leafletLayer = this.loadRasterXYZ(config);
                    break;
                case 'wms':
                    leafletLayer = this.loadWMS(config);
                    break;
                case 'pmtiles':
                    leafletLayer = await this.loadPMTiles(config);
                    break;
                default:
                    throw new Error(`Unknown layer type: ${config.type}`);
            }

            return leafletLayer;
        } catch (error) {
            console.error(`Error loading layer ${config.id}:`, error);
            throw error;
        }
    },

    async loadGeoJSON(config) {
        const response = await this.fetchWithTimeout(config.url, 30000);
        if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Default style
        const defaultStyle = {
            color: config.style?.color || '#3388ff',
            weight: config.style?.weight || 2,
            opacity: config.style?.opacity || 0.8,
            fillColor: config.style?.fillColor || '#3388ff',
            fillOpacity: config.style?.fillOpacity || 0.5
        };

        // Create GeoJSON layer
        const layer = L.geoJSON(data, {
            style: defaultStyle,
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 6,
                    ...defaultStyle
                });
            },
            onEachFeature: (feature, layer) => {
                // Store feature reference for later use
                layer._geodashboard_feature = feature;
            }
        });

        // Store metadata
        layer._geodashboard_type = 'geojson';
        layer._geodashboard_config = config;
        layer._geodashboard_data = data;
        layer._geodashboard_featureCount = data.features ? data.features.length : 0;

        // Apply styled mode if specified
        if (config.style && config.style.mode && config.style.mode !== 'single') {
            StylesModule.applyStyle(layer, config.style, data.features);
        }

        return layer;
    },

    loadRasterXYZ(config) {
        const layer = L.tileLayer(config.url, {
            attribution: config.attribution || 'Tile layer',
            maxZoom: config.maxZoom || 18,
            minZoom: config.minZoom || 0,
            tms: config.tms || false
        });

        layer._geodashboard_type = 'raster-xyz';
        layer._geodashboard_config = config;

        return layer;
    },

    loadWMS(config) {
        // WMS Layer
        // Expected config: { url, layers, styles, transparent, format, ... }
        const wmsParams = {
            layers: config.layers || 'default',
            styles: config.styles || '',
            format: config.format || 'image/png',
            transparent: config.transparent !== false,
            attribution: config.attribution || 'WMS layer'
        };

        const layer = L.tileLayer.wms(config.url, wmsParams);

        layer._geodashboard_type = 'wms';
        layer._geodashboard_config = config;

        return layer;
    },

    async loadPMTiles(config) {
        try {
            // Verificar se a biblioteca PMTiles está disponível
            if (!window.pmtiles || !window.pmtiles.PMTiles || !window.pmtiles.leafletRasterLayer) {
                throw new Error('Biblioteca PMTiles não está carregada corretamente');
            }

            console.log(`[layers.js] Carregando PMTiles: ${config.name} (${config.url})`);

            // Obter classes PMTiles
            const PMTiles = window.pmtiles.PMTiles;
            const leafletRasterLayer = window.pmtiles.leafletRasterLayer;

            // Criar instância PMTiles
            const pmtiles = new PMTiles(config.url);

            // Buscar header para obter metadados
            const header = await pmtiles.getHeader();
            console.log(`[layers.js] Header PMTiles obtido - minZoom: ${header.minZoom}, maxZoom: ${header.maxZoom}, tileType: ${header.tileType}`);

            // Usar a função helper leafletRasterLayer que já vem com a biblioteca
            const layer = leafletRasterLayer(pmtiles, {
                minZoom: Math.max(0, header.minZoom || 0),
                maxZoom: Math.min(28, header.maxZoom || 14),
                attribution: config.attribution || 'PMTiles',
                tms: false
            });

            // Armazenar metadados
            layer._geodashboard_type = 'pmtiles';
            layer._geodashboard_config = config;
            layer._pmtilesSource = pmtiles;

            console.log(`[layers.js] ✓ Camada PMTiles criada com sucesso: ${config.name}`);
            return layer;

        } catch (error) {
            console.error(`[layers.js] ✗ Erro ao carregar PMTiles ${config.name}:`, error);
            throw new Error(`Não foi possível carregar camada PMTiles "${config.name}": ${error.message}`);
        }
    },

    getPopupContent(feature, popupFields) {
        if (!feature || !feature.properties) return 'No data';

        let html = '<div class="popup-content">';

        const fields = popupFields && popupFields.length > 0 ? popupFields : Object.keys(feature.properties);

        fields.forEach(field => {
            const value = feature.properties[field];
            if (value !== undefined && value !== null) {
                html += `<div class="popup-row">
                    <strong>${field}:</strong> ${this.escapeHtml(String(value))}
                </div>`;
            }
        });

        html += '</div>';
        return html;
    },

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    getFeatureCount(leafletLayer) {
        if (!leafletLayer) return 0;
        if (leafletLayer._geodashboard_featureCount) {
            return leafletLayer._geodashboard_featureCount;
        }
        return 0;
    },

    getLayerBounds(leafletLayer) {
        if (!leafletLayer || !leafletLayer.getBounds) return null;
        return leafletLayer.getBounds();
    },

    setupLayerPopups(leafletLayer, config) {
        if (leafletLayer._geodashboard_type !== 'geojson') {
            return;
        }

        leafletLayer.on('click', (e) => {
            if (!e.layer || !e.layer._geodashboard_feature) return;

            const feature = e.layer._geodashboard_feature;
            const popupFields = config.popupFields || [];
            const content = this.getPopupContent(feature, popupFields);

            L.popup()
                .setLatLng(e.latlng)
                .setContent(content)
                .openOn(MapModule.getMap());
        });

        // Hover effect for GeoJSON
        leafletLayer.on('mouseover', (e) => {
            e.layer.setStyle({
                weight: (config.style?.weight || 2) + 1,
                opacity: Math.min((config.style?.opacity || 0.8) + 0.2, 1)
            });
        });

        leafletLayer.on('mouseout', (e) => {
            leafletLayer.resetStyle(e.layer);
        });
    },

    reapplyStyle(leafletLayer, styleObj) {
        if (leafletLayer._geodashboard_type !== 'geojson') {
            return;
        }

        const data = leafletLayer._geodashboard_data;
        const features = data && data.features ? data.features : [];

        // Apply the new style using StylesModule
        StylesModule.applyStyle(leafletLayer, styleObj, features);
    }
};

// Add styles to popup content in index.html CSS
const popupStyles = `
<style>
.popup-content {
    font-size: 12px;
}
.popup-row {
    margin-bottom: 6px;
    word-break: break-word;
}
.popup-row strong {
    display: inline-block;
    min-width: 80px;
    color: #0066cc;
}
</style>
`;
