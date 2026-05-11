/**
 * Charts Module - Manage indicators and statistics
 */

const ChartsModule = {
    init() {
        this.updateIndicators();
    },

    updateIndicators() {
        const totalLayers = Object.keys(AppState.layers).length;
        const visibleLayers = Object.values(AppState.layers).filter(l => l.visible).length;
        const totalFeatures = Object.values(AppState.layers)
            .filter(l => l.config.type === 'geojson' && l.leafletLayer)
            .reduce((sum, l) => sum + (LayersModule.getFeatureCount(l.leafletLayer) || 0), 0);

        document.getElementById('total-layers').textContent = totalLayers;
        document.getElementById('visible-layers').textContent = visibleLayers;
        document.getElementById('total-features').textContent = totalFeatures;
    }
};
