/**
 * Legend Module - Manage dynamic legends for layers
 */

const LegendModule = {
    legendContent: null,

    init() {
        this.legendContent = document.getElementById('legend-content');
        this.setupLegendToggle();
    },

    setupLegendToggle() {
        const toggleBtn = document.getElementById('toggle-legend');
        const legendPanel = document.querySelector('.legend-panel');

        if (toggleBtn && legendPanel) {
            toggleBtn.addEventListener('click', () => {
                legendPanel.classList.toggle('collapsed');
            });
        }
    },

    update() {
        if (!this.legendContent) return;

        const visibleLayers = Object.values(AppState.layers)
            .filter(layer => layer.visible && layer.config.legend)
            .sort((a, b) => (b.order || 0) - (a.order || 0));

        if (visibleLayers.length === 0) {
            this.legendContent.innerHTML = '<p style="font-size: 12px; color: var(--color-text-muted); padding: 8px;">No legend available</p>';
            return;
        }

        let html = '';
        visibleLayers.forEach(layer => {
            html += this.renderLayerLegend(layer);
        });

        this.legendContent.innerHTML = html;
    },

    renderLayerLegend(layer) {
        const legend = layer.config.legend;
        if (!legend) return '';

        // Use legendTitle with fallback to displayName, then name, then id
        const legendTitle = layer.legendTitle || layer.displayName || layer.config.name || layer.config.id;

        let html = `<div class="legend-item">
            <div class="legend-item-layer">${legendTitle}</div>`;

        // Check for styled GeoJSON layers first
        if (layer.config.type === 'geojson' && layer.leafletLayer) {
            const style = layer.customStyle || layer.config.style;
            if (style && style.mode && style.mode !== 'single') {
                html += this.renderStyledLegend(layer, style);
                html += '</div>';
                return html;
            }
        }

        // Color legend with colors array
        if (legend.type === 'color' && legend.colors && Array.isArray(legend.colors)) {
            legend.colors.forEach(item => {
                const color = item.color || '#ccc';
                const label = item.label || 'Unknown';
                html += `<div class="legend-item-entry">
                    <div class="legend-item-color" style="background-color: ${color}"></div>
                    <span class="legend-item-label">${label}</span>
                </div>`;
            });
        }
        // Category legend
        else if (legend.type === 'category' && legend.categories) {
            legend.categories.forEach(cat => {
                const color = cat.color || '#0066cc';
                const label = cat.label || cat.value;
                html += `<div class="legend-item-entry">
                    <div class="legend-item-color" style="background-color: ${color}"></div>
                    <span class="legend-item-label">${label}</span>
                </div>`;
            });
        }
        // Simple text legend
        else if (legend.type === 'text' && legend.items) {
            legend.items.forEach(item => {
                html += `<div class="legend-item-entry">
                    <span class="legend-item-label">• ${item}</span>
                </div>`;
            });
        }
        // Default: show layer name only
        else {
            html += `<div class="legend-item-entry">
                <span class="legend-item-label">${legend.label || 'Layer'}</span>
            </div>`;
        }

        html += '</div>';
        return html;
    },

    renderStyledLegend(layer, style) {
        let html = '';

        if (style.mode === 'category') {
            html += this.renderCategoryStyledLegend(style);
        } else if (style.mode === 'graduated') {
            html += this.renderGraduatedStyledLegend(layer, style);
        }

        return html;
    },

    renderCategoryStyledLegend(style) {
        let html = '';
        const categories = style.categories || {};
        const defaultStyle = style.default || { fillColor: '#cccccc' };

        Object.entries(categories).forEach(([value, categoryStyle]) => {
            const color = categoryStyle.fillColor || defaultStyle.fillColor;
            html += `<div class="legend-item-entry">
                <div class="legend-item-color" style="background-color: ${color}"></div>
                <span class="legend-item-label">${value}</span>
            </div>`;
        });

        return html;
    },

    renderGraduatedStyledLegend(layer, style) {
        let html = '';
        const features = layer._geodashboard_data?.features || [];
        const field = style.field;
        const classCount = style.classes || 5;
        const paletteType = style.palette || 'sequential';

        if (features.length === 0) return html;

        // Get numeric range
        const { min, max } = StylesModule.getNumericRange(features, field);

        // Generate gradient
        const gradient = StylesModule.generateGradientColors(min, max, paletteType, classCount);

        // Render color ramp
        html += '<div class="legend-gradient-ramp">';
        gradient.classes.forEach((cls, idx) => {
            const label = `${Math.round(cls.min)}-${Math.round(cls.max)}`;
            html += `<div class="legend-gradient-item">
                <div class="legend-gradient-color" style="background-color: ${cls.color}"></div>
                <span class="legend-gradient-label">${label}</span>
            </div>`;
        });
        html += '</div>';

        return html;
    }
};
