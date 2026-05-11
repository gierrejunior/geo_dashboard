/**
 * Styles Module - GeoJSON layer styling and color utilities
 * Handles color palettes, style modes, and feature styling
 */

const StylesModule = {
    // =====================================================
    // Predefined Color Palettes
    // =====================================================

    palettes: {
        // Categorical palettes (distinct colors)
        categorical: {
            accent: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
            dark: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#d62828', '#f77f00', '#fcbf49', '#eae2b7', '#003049'],
            pastel: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2', '#b2df8a']
        },
        // Sequential palettes (single hue progression)
        sequential: {
            blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
            greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
            purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
            reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
            oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704']
        },
        // Diverging palettes (two hues from neutral)
        diverging: {
            rdbu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddfc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
            rdgy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddfc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
            brbg: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
            prgn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b']
        },
        // Grayscale palette
        grayscale: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000']
    },

    // =====================================================
    // Palette Generation
    // =====================================================

    createColorPalette(type, count) {
        if (type === 'categorical') {
            return this.palettes.categorical.accent.slice(0, count);
        }
        if (type === 'sequential') {
            return this.generateSequentialPalette(count);
        }
        if (type === 'diverging') {
            return this.generateDivergingPalette(count);
        }
        if (type === 'grayscale') {
            return this.generateGrayscalePalette(count);
        }
        return this.palettes.categorical.accent.slice(0, count);
    },

    generateSequentialPalette(count) {
        // Generate a blue sequential palette from light to dark
        const palette = this.palettes.sequential.blues;
        if (count >= palette.length) {
            return palette;
        }
        // Sample from palette by index
        const step = (palette.length - 1) / (count - 1);
        return Array.from({ length: count }, (_, i) =>
            palette[Math.round(i * step)]
        );
    },

    generateDivergingPalette(count) {
        // Generate red-blue diverging palette centered on white
        const palette = this.palettes.diverging.rdbu;
        if (count >= palette.length) {
            return palette;
        }
        const step = (palette.length - 1) / (count - 1);
        return Array.from({ length: count }, (_, i) =>
            palette[Math.round(i * step)]
        );
    },

    generateGrayscalePalette(count) {
        const palette = this.palettes.grayscale;
        if (count >= palette.length) {
            return palette;
        }
        const step = (palette.length - 1) / (count - 1);
        return Array.from({ length: count }, (_, i) =>
            palette[Math.round(i * step)]
        );
    },

    // =====================================================
    // Gradient Color Generation (for numeric ranges)
    // =====================================================

    generateGradientColors(min, max, paletteType = 'sequential', count = 5) {
        const colors = this.createColorPalette(paletteType, count);
        const range = max - min;

        return {
            colors: colors,
            classes: Array.from({ length: count }, (_, i) => ({
                min: min + (range / count) * i,
                max: min + (range / count) * (i + 1),
                color: colors[i]
            })),
            getColor: (value) => {
                if (value < min) return colors[0];
                if (value > max) return colors[colors.length - 1];

                const index = Math.floor((value - min) / range * (count - 1));
                return colors[Math.min(index, colors.length - 1)];
            }
        };
    },

    // =====================================================
    // Feature Property Extraction
    // =====================================================

    getFeatureValue(feature, field) {
        if (!feature || !feature.properties) return undefined;
        return feature.properties[field];
    },

    getUniqueValues(features, field) {
        const values = new Set();
        features.forEach(feature => {
            const value = this.getFeatureValue(feature, field);
            if (value !== undefined && value !== null) {
                values.add(value);
            }
        });
        return Array.from(values).sort((a, b) => {
            // Sort numerically if both are numbers, otherwise alphabetically
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            return String(a).localeCompare(String(b));
        });
    },

    getNumericRange(features, field) {
        let min = Infinity;
        let max = -Infinity;

        features.forEach(feature => {
            const value = this.getFeatureValue(feature, field);
            if (typeof value === 'number') {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        });

        return min === Infinity ? { min: 0, max: 0 } : { min, max };
    },

    // =====================================================
    // Style Application
    // =====================================================

    applyStyle(leafletLayer, styleObj, featureData = null) {
        if (!leafletLayer) return;

        const mode = styleObj.mode || 'single';

        if (mode === 'single') {
            this.applySingleStyle(leafletLayer, styleObj);
        } else if (mode === 'category') {
            this.applyCategoryStyle(leafletLayer, styleObj, featureData);
        } else if (mode === 'graduated') {
            this.applyGraduatedStyle(leafletLayer, styleObj, featureData);
        }
    },

    applySingleStyle(leafletLayer, styleObj) {
        const style = {
            fillColor: styleObj.fillColor || '#3388ff',
            fillOpacity: styleObj.fillOpacity !== undefined ? styleObj.fillOpacity : 0.4,
            color: styleObj.color || '#0044aa',
            opacity: styleObj.opacity !== undefined ? styleObj.opacity : 1,
            weight: styleObj.weight || 2,
            dashArray: styleObj.dashArray || null
        };

        if (leafletLayer.eachLayer) {
            leafletLayer.eachLayer(layer => {
                if (layer.setStyle) {
                    layer.setStyle(style);
                }
            });
        } else if (leafletLayer.setStyle) {
            leafletLayer.setStyle(style);
        }
    },

    applyCategoryStyle(leafletLayer, styleObj, featureData = null) {
        const field = styleObj.field;
        const categories = styleObj.categories || {};
        const defaultStyle = styleObj.default || {
            fillColor: '#cccccc',
            color: '#666666'
        };

        if (leafletLayer.eachLayer) {
            leafletLayer.eachLayer(layer => {
                const feature = layer.feature;
                if (feature && layer.setStyle) {
                    const value = this.getFeatureValue(feature, field);
                    const categoryStyle = categories[value] || defaultStyle;

                    const style = {
                        fillColor: categoryStyle.fillColor || defaultStyle.fillColor,
                        fillOpacity: categoryStyle.fillOpacity !== undefined ? categoryStyle.fillOpacity : 0.4,
                        color: categoryStyle.color || defaultStyle.color,
                        opacity: categoryStyle.opacity !== undefined ? categoryStyle.opacity : 1,
                        weight: categoryStyle.weight || 2,
                        dashArray: categoryStyle.dashArray || null
                    };

                    layer.setStyle(style);
                }
            });
        }
    },

    applyGraduatedStyle(leafletLayer, styleObj, featureData = null) {
        const field = styleObj.field;
        const paletteType = styleObj.palette || 'sequential';
        const classCount = styleObj.classes || 5;

        // Get numeric range from features
        const features = [];
        if (leafletLayer.eachLayer) {
            leafletLayer.eachLayer(layer => {
                if (layer.feature) features.push(layer.feature);
            });
        }

        const { min, max } = this.getNumericRange(features, field);
        const gradient = this.generateGradientColors(min, max, paletteType, classCount);

        if (leafletLayer.eachLayer) {
            leafletLayer.eachLayer(layer => {
                const feature = layer.feature;
                if (feature && layer.setStyle) {
                    const value = this.getFeatureValue(feature, field);

                    if (typeof value === 'number') {
                        const color = gradient.getColor(value);
                        const style = {
                            fillColor: color,
                            fillOpacity: styleObj.fillOpacity !== undefined ? styleObj.fillOpacity : 0.4,
                            color: styleObj.color || '#0044aa',
                            opacity: styleObj.opacity !== undefined ? styleObj.opacity : 1,
                            weight: styleObj.weight || 2,
                            dashArray: styleObj.dashArray || null
                        };

                        layer.setStyle(style);
                    }
                }
            });
        }
    },

    // =====================================================
    // Style Object Builders
    // =====================================================

    createSingleStyle(fillColor, fillOpacity = 0.4, color = '#0044aa', weight = 2, opacity = 1) {
        return {
            mode: 'single',
            fillColor,
            fillOpacity,
            color,
            weight,
            opacity,
            dashArray: null
        };
    },

    createCategoryStyle(field, categories, defaultColor = '#cccccc') {
        return {
            mode: 'category',
            field,
            categories,
            default: {
                fillColor: defaultColor,
                color: '#333333'
            }
        };
    },

    createGraduatedStyle(field, palette = 'sequential', classes = 5) {
        return {
            mode: 'graduated',
            field,
            palette,
            classes,
            fillOpacity: 0.4,
            color: '#0044aa',
            weight: 2,
            opacity: 1
        };
    }
};
