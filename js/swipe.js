/**
 * Swipe Module - Layer comparison with swipe effect
 */

const SwipeModule = {
    enabled: false,
    swipeContainer: null,
    layer1: null,
    layer2: null,
    layer1Id: null,
    layer2Id: null,
    sliderDiv: null,

    init() {
        this.swipeContainer = document.getElementById('swipe-control');
    },

    enable() {
        this.enabled = true;
        if (this.swipeContainer) {
            this.swipeContainer.style.display = 'block';
        }
        this.updateLayerSelects();
    },

    disable() {
        this.enabled = false;
        this.layer1 = null;
        this.layer2 = null;
        this.layer1Id = null;
        this.layer2Id = null;
        if (this.swipeContainer) {
            this.swipeContainer.style.display = 'none';
        }
        this.removeSwipeSlider();
    },

    updateLayerSelects() {
        const select1 = document.getElementById('swipe-layer-1');
        const select2 = document.getElementById('swipe-layer-2');

        if (!select1 || !select2) return;

        // Get all visible non-GeoJSON layers (raster and WMS)
        const swipeableLayers = Object.values(AppState.layers)
            .filter(l => l.config.type !== 'geojson')
            .sort((a, b) => (b.order || 0) - (a.order || 0));

        // Clear and populate select1
        select1.innerHTML = '<option value="">Select layer 1</option>';
        swipeableLayers.forEach(layer => {
            const option = document.createElement('option');
            option.value = layer.config.id;
            option.textContent = layer.config.name;
            select1.appendChild(option);
        });

        // Clear and populate select2
        select2.innerHTML = '<option value="">Select layer 2</option>';
        swipeableLayers.forEach(layer => {
            const option = document.createElement('option');
            option.value = layer.config.id;
            option.textContent = layer.config.name;
            select2.appendChild(option);
        });

        // Event listeners
        select1.addEventListener('change', (e) => {
            this.layer1 = e.target.value;
            this.layer1Id = e.target.value;
            this.updateSwipe();
        });

        select2.addEventListener('change', (e) => {
            this.layer2 = e.target.value;
            this.layer2Id = e.target.value;
            this.updateSwipe();
        });
    },

    updateSwipe() {
        if (!this.layer1 || !this.layer2) {
            this.removeSwipeSlider();
            return;
        }

        // Get Leaflet layers
        const leaflet1 = AppState.layers[this.layer1]?.leafletLayer;
        const leaflet2 = AppState.layers[this.layer2]?.leafletLayer;

        if (!leaflet1 || !leaflet2) {
            this.removeSwipeSlider();
            return;
        }

        this.createSwipeSlider(leaflet1, leaflet2);
    },

    createSwipeSlider(layer1, layer2) {
        this.removeSwipeSlider();

        const map = MapModule.getMap();
        const container = map.getContainer();

        // Bring both layers to front
        if (layer1.bringToFront) layer1.bringToFront();
        if (layer2.bringToFront) layer2.bringToFront();

        // Create slider div
        const slider = document.createElement('div');
        slider.className = 'leaflet-swipe-slider';
        slider.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            width: 4px;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            cursor: ew-resize;
            z-index: 999;
            transform: translateX(-50%);
            box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
        `;

        container.appendChild(slider);
        this.sliderDiv = slider;

        // Set layer2 clip path
        let pos = 50;

        const updateClip = () => {
            const containerWidth = container.offsetWidth;
            const clipPercent = (pos / containerWidth) * 100;

            // Apply clip-path to layer2
            if (layer2.getPane) {
                const pane = layer2.getPane();
                pane.style.clipPath = `inset(0 ${100 - clipPercent}% 0 0)`;
            }

            slider.style.left = pos + 'px';
        };

        const onMove = (e) => {
            const rect = container.getBoundingClientRect();
            pos = Math.max(0, Math.min(e.clientX - rect.left, container.offsetWidth));
            updateClip();
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
        };

        slider.addEventListener('mousedown', () => {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
        });

        updateClip();
    },

    removeSwipeSlider() {
        if (this.sliderDiv) {
            this.sliderDiv.remove();
            this.sliderDiv = null;
        }

        // Remove clip-path from all layers
        if (MapModule.getMap()) {
            const container = MapModule.getMap().getContainer();
            const panes = container.querySelectorAll('[style*="clip-path"]');
            panes.forEach(pane => {
                pane.style.clipPath = '';
            });
        }
    }
};
