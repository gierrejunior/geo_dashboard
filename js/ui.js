/**
 * UI Module - Handle all user interface interactions
 */

const UIModule = {
    init() {
        this.setupThemeToggle();
        this.setupSidebarToggle();
        this.setupAdvancedToggle();
        this.setupLayerAddition();
        this.setupSearch();
        this.setupBookmarks();
        this.setupLayerControls();
        this.setupToolButtons();
        this.setupDashboardManagement();
        this.setupTabNavigation();
    },

    // =====================================================
    // Theme Toggle
    // =====================================================

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = Storage.getTheme();

        document.documentElement.setAttribute('data-theme', currentTheme);

        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            Storage.setTheme(newTheme);
        });
    },

    // =====================================================
    // Sidebar Toggle
    // =====================================================

    setupSidebarToggle() {
        const toggleBtn = document.getElementById('toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !e.target.closest('.sidebar') && !e.target.closest('#toggle-sidebar')) {
                sidebar.classList.add('collapsed');
            }
        });
    },

    // =====================================================
    // Advanced Section Toggle
    // =====================================================

    setupAdvancedToggle() {
        const toggleBtn = document.getElementById('advanced-toggle');
        const content = document.getElementById('advanced-content');

        if (!toggleBtn || !content) return;

        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    },

    // =====================================================
    // Tab Navigation
    // =====================================================

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;

                // Update button states
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update tab content visibility
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    },

    // =====================================================
    // Layer Addition
    // =====================================================

    setupLayerAddition() {
        const addBtn = document.getElementById('add-layer-btn');
        const nameInput = document.getElementById('layer-name');
        const urlInput = document.getElementById('layer-url');
        const typeSelect = document.getElementById('layer-type');
        const messageDiv = document.getElementById('add-layer-message');

        addBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            const type = typeSelect.value;

            if (!name || !url) {
                this.showMessage(messageDiv, 'Please fill in all fields', 'error');
                return;
            }

            if (!this.isValidURL(url)) {
                this.showMessage(messageDiv, 'Invalid URL format', 'error');
                return;
            }

            try {
                const config = {
                    id: `custom_${Date.now()}`,
                    name: name,
                    type: type,
                    url: url,
                    visible: true,
                    opacity: 1,
                    style: {
                        color: '#3388ff',
                        fillColor: '#3388ff'
                    },
                    legend: null,
                    popupFields: []
                };

                const leafletLayer = await LayersModule.loadLayer(config);
                await AppState.addLayer(config, leafletLayer);

                this.showMessage(messageDiv, `Layer "${name}" added successfully!`, 'success');
                nameInput.value = '';
                urlInput.value = '';
                typeSelect.value = 'geojson';

                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            } catch (error) {
                this.showMessage(messageDiv, `Error: ${error.message}`, 'error');
            }
        });
    },

    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    showMessage(element, message, type) {
        element.textContent = message;
        element.className = type;
        element.style.display = 'block';
    },

    // =====================================================
    // Search
    // =====================================================

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const resultsDiv = document.getElementById('search-results');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (!query) {
                resultsDiv.innerHTML = '';
                return;
            }

            this.performSearch(query, resultsDiv);
        });
    },

    performSearch(query, resultsDiv) {
        const results = [];

        // Search only in visible GeoJSON layers
        Object.values(AppState.layers).forEach(layer => {
            if (layer.config.type !== 'geojson' || !layer._geodashboard_data || !layer.visible) return;

            const features = layer._geodashboard_data.features || [];
            const searchableFields = layer.config.searchableFields;
            features.forEach(feature => {
                const props = feature.properties || {};

                // Use searchableFields if defined, otherwise search all properties
                const fieldsToSearch = searchableFields && searchableFields.length > 0
                    ? searchableFields
                    : Object.keys(props);

                fieldsToSearch.forEach(key => {
                    if (key in props) {
                        const value = props[key];
                        if (String(value).toLowerCase().includes(query)) {
                            results.push({
                                feature: feature,
                                layer: layer,
                                property: key,
                                value: value
                            });
                        }
                    }
                });
            });
        });

        // Render results
        resultsDiv.innerHTML = '';
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div style="font-size: 12px; color: var(--color-text-muted); padding: 8px;">No results found</div>';
            return;
        }

        results.slice(0, 20).forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="search-result-item-label">${result.layer.config.name}</div>
                <div class="search-result-item-value">${result.property}: ${String(result.value).substring(0, 50)}</div>
            `;

            item.addEventListener('click', () => {
                // Zoom to feature
                MapModule.zoomToFeature(result.feature);

                // Show popup
                if (result.feature.geometry.type === 'Point') {
                    const coords = result.feature.geometry.coordinates;
                    const latlng = L.latLng(coords[1], coords[0]);
                    const popupContent = LayersModule.getPopupContent(result.feature, result.layer.config.popupFields);
                    L.popup()
                        .setLatLng(latlng)
                        .setContent(popupContent)
                        .openOn(MapModule.getMap());
                }

                // Clear search
                document.getElementById('search-input').value = '';
                resultsDiv.innerHTML = '';
            });

            resultsDiv.appendChild(item);
        });

        if (results.length > 20) {
            const more = document.createElement('div');
            more.style.cssText = 'font-size: 11px; color: var(--color-text-muted); padding: 8px; text-align: center;';
            more.textContent = `... and ${results.length - 20} more results`;
            resultsDiv.appendChild(more);
        }
    },

    // =====================================================
    // Bookmarks
    // =====================================================

    setupBookmarks() {
        const saveBtn = document.getElementById('save-bookmark-btn');
        const nameInput = document.getElementById('bookmark-name');

        saveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a bookmark name');
                return;
            }

            const map = MapModule.getMap();
            const bookmark = {
                id: `bookmark_${Date.now()}`,
                name: name,
                center: map.getCenter(),
                zoom: map.getZoom(),
                activeBasemap: MapModule.getActiveBasemapId(),
                layers: Object.fromEntries(
                    Object.entries(AppState.layers).map(([id, layer]) => [
                        id,
                        {
                            visible: layer.visible,
                            opacity: layer.opacity
                        }
                    ])
                )
            };

            Storage.addBookmark(bookmark);
            nameInput.value = '';
            this.updateBookmarksList();
        });

        this.updateBookmarksList();
    },

    updateBookmarksList() {
        const bookmarksList = document.getElementById('bookmarks-list');
        const bookmarks = Storage.getBookmarks();

        bookmarksList.innerHTML = '';

        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = '<p style="font-size: 12px; color: var(--color-text-muted); padding: 8px;">No saved views yet</p>';
            return;
        }

        bookmarks.forEach(bookmark => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'bookmark-item-name';
            nameSpan.textContent = bookmark.name;

            nameSpan.addEventListener('click', () => {
                this.loadBookmark(bookmark);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bookmark-item-btn';
            deleteBtn.innerHTML = '✕';

            deleteBtn.addEventListener('click', () => {
                Storage.removeBookmark(bookmark.id);
                this.updateBookmarksList();
            });

            item.appendChild(nameSpan);
            item.appendChild(deleteBtn);
            bookmarksList.appendChild(item);
        });
    },

    loadBookmark(bookmark) {
        const map = MapModule.getMap();

        // Restore basemap if saved
        if (bookmark.activeBasemap) {
            MapModule.setActiveBasemap(bookmark.activeBasemap);
        }

        // Restore map view
        map.setView(bookmark.center, bookmark.zoom);

        // Restore layer visibility and opacity
        if (bookmark.layers) {
            Object.entries(bookmark.layers).forEach(([layerId, state]) => {
                if (AppState.layers[layerId]) {
                    AppState.setLayerVisibility(layerId, state.visible);
                    AppState.setLayerOpacity(layerId, state.opacity);
                }
            });

            this.updateLayersList();
        }
    },

    // =====================================================
    // Layer Controls
    // =====================================================

    setupLayerControls() {
        // Will be called when layers are added/updated
    },

    updateLayersList() {
        const layersList = document.getElementById('layers-list');

        // Check if a project is loaded (has saved visible layers)
        const hasProjectConfig = AppState.projectConfig && Object.keys(AppState.projectConfig.visibleLayers || {}).length > 0;

        // Get layers to display
        let layers;
        if (hasProjectConfig) {
            // Show only project layers
            const projectLayerIds = Object.keys(AppState.projectConfig.visibleLayers);
            layers = Object.values(AppState.layers)
                .filter(layer => projectLayerIds.includes(layer.config.id))
                .sort((a, b) => (b.order || 0) - (a.order || 0));
        } else {
            // Show all layers (catalog view)
            layers = Object.values(AppState.layers)
                .sort((a, b) => (b.order || 0) - (a.order || 0));
        }

        layersList.innerHTML = '';

        // Add project header if in project mode
        if (hasProjectConfig) {
            const projectHeader = document.createElement('div');
            projectHeader.className = 'project-header';
            projectHeader.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 600; color: var(--color-text);">PROJECT LAYERS</span>
                    <button id="add-catalog-layers-btn" style="padding: 4px 8px; font-size: 12px; cursor: pointer; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text);">+ Add from Catalog</button>
                </div>
            `;
            layersList.appendChild(projectHeader);

            // Add event listener for add layers button
            document.getElementById('add-catalog-layers-btn').addEventListener('click', () => {
                this.showCatalogModal();
            });
        }

        if (layers.length === 0) {
            layersList.innerHTML += '<p style="font-size: 12px; color: var(--color-text-muted); padding: 8px;">No layers loaded</p>';
            return;
        }

        // Group layers by their group field
        const grouped = {};
        layers.forEach(layer => {
            const group = layer.config.group || 'My Layers';
            if (!grouped[group]) {
                grouped[group] = [];
            }
            grouped[group].push(layer);
        });

        // Get saved group states from localStorage
        const groupStates = JSON.parse(localStorage.getItem('layerGroups') || '{}');

        // Render grouped layers
        Object.entries(grouped).forEach(([groupName, groupLayers]) => {
            // Group container
            const groupContainer = document.createElement('div');
            groupContainer.className = 'layer-group';

            // Group header (collapsible)
            const groupHeader = document.createElement('div');
            groupHeader.className = 'layer-group-header';

            // Toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer-group-toggle';
            const isExpanded = groupStates[groupName] !== false;
            toggleBtn.setAttribute('aria-expanded', isExpanded);
            toggleBtn.innerHTML = isExpanded ? '▼' : '▶';
            toggleBtn.title = isExpanded ? 'Collapse group' : 'Expand group';

            // Group name
            const groupNameSpan = document.createElement('span');
            groupNameSpan.className = 'layer-group-name';
            groupNameSpan.textContent = groupName;

            groupHeader.appendChild(toggleBtn);
            groupHeader.appendChild(groupNameSpan);

            // Group content
            const groupContent = document.createElement('div');
            groupContent.className = 'layer-group-content';
            if (!isExpanded) {
                groupContent.classList.add('collapsed');
            }

            // Layers in group
            groupLayers.forEach(layer => {
                const item = this.createLayerItem(layer);
                groupContent.appendChild(item);
            });

            // Toggle handler
            toggleBtn.addEventListener('click', () => {
                const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                toggleBtn.setAttribute('aria-expanded', !expanded);
                toggleBtn.innerHTML = expanded ? '▶' : '▼';
                toggleBtn.title = expanded ? 'Expand group' : 'Collapse group';
                groupContent.classList.toggle('collapsed');

                // Save state
                groupStates[groupName] = !expanded;
                localStorage.setItem('layerGroups', JSON.stringify(groupStates));
            });

            groupContainer.appendChild(groupHeader);
            groupContainer.appendChild(groupContent);
            layersList.appendChild(groupContainer);
        });
    },

    createLayerItem(layer) {
        const item = document.createElement('div');
        item.className = `layer-item ${layer.visible ? '' : 'disabled'} status-${layer.status || 'loaded'}`;
        item.dataset.layerId = layer.config.id;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = layer.visible;
        checkbox.disabled = layer.status === 'error' || layer.status === 'loading';
        checkbox.addEventListener('change', async () => {
            if (checkbox.checked) {
                // Activate layer if not already loaded
                if (layer.status === 'available') {
                    try {
                        await AppState.activateLayer(layer.config.id);
                    } catch (error) {
                        checkbox.checked = false;
                        this.updateLayersList();
                    }
                } else {
                    // Layer already loaded, just set visible
                    AppState.setLayerVisibility(layer.config.id, true);
                }
            } else {
                // Deactivate layer
                await AppState.deactivateLayer(layer.config.id);
            }
        });

        const toggle = document.createElement('div');
        toggle.className = 'layer-item-toggle';
        toggle.appendChild(checkbox);

        // Info section
        const info = document.createElement('div');
        info.className = 'layer-item-info';

        // Name and status indicator
        const nameContainer = document.createElement('div');
        nameContainer.className = 'layer-item-name-container';

        const name = document.createElement('div');
        name.className = 'layer-item-name';
        name.textContent = layer.displayName;

        const statusIndicator = document.createElement('span');
        statusIndicator.className = `layer-status-indicator status-${layer.status || 'loaded'}`;
        statusIndicator.title = this.getStatusTitle(layer.status || 'loaded', layer.error);

        if (layer.status === 'loading') {
            statusIndicator.textContent = '⏳';
        } else if (layer.status === 'error') {
            statusIndicator.textContent = '⚠';
        } else {
            statusIndicator.textContent = '✓';
        }

        nameContainer.appendChild(name);
        nameContainer.appendChild(statusIndicator);

        // Description if available
        let descriptionDiv = null;
        if (layer.config.description) {
            descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'layer-item-description';
            descriptionDiv.textContent = layer.config.description;
        }

        // User-added layer note
        let userNoteDiv = null;
        if (layer.config.id.startsWith('custom_')) {
            userNoteDiv = document.createElement('div');
            userNoteDiv.className = 'layer-item-user-note';
            userNoteDiv.textContent = 'Saved in this browser';
        }

        // Error message if any
        let errorDiv = null;
        if (layer.error) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'layer-item-error';
            errorDiv.textContent = `Error: ${layer.error}`;
        }

        const opacityDiv = document.createElement('div');
        opacityDiv.className = 'layer-item-opacity';

        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity:';

        const opacityInput = document.createElement('input');
        opacityInput.type = 'range';
        opacityInput.min = '0';
        opacityInput.max = '100';
        opacityInput.value = (layer.opacity || 1) * 100;
        opacityInput.disabled = layer.status === 'error';
        opacityInput.addEventListener('input', (e) => {
            const opacity = e.target.value / 100;
            AppState.setLayerOpacity(layer.config.id, opacity);
        });

        opacityDiv.appendChild(opacityLabel);
        opacityDiv.appendChild(opacityInput);

        info.appendChild(nameContainer);
        if (descriptionDiv) info.appendChild(descriptionDiv);
        if (userNoteDiv) info.appendChild(userNoteDiv);
        if (errorDiv) info.appendChild(errorDiv);
        info.appendChild(opacityDiv);

        // Controls section
        const controls = document.createElement('div');
        controls.className = 'layer-item-controls';

        // Up button
        const upBtn = this.createControlButton('↑', 'Move up', () => {
            AppState.reorderLayer(layer.config.id, 1);
            this.updateLayersList();
        });
        upBtn.disabled = layer.status === 'error';

        // Down button
        const downBtn = this.createControlButton('↓', 'Move down', () => {
            AppState.reorderLayer(layer.config.id, -1);
            this.updateLayersList();
        });
        downBtn.disabled = layer.status === 'error';

        // Zoom button
        const zoomBtn = this.createControlButton('🔍', 'Zoom to layer', () => {
            MapModule.zoomToLayer(layer.config.id);
        });
        zoomBtn.disabled = layer.status === 'error' || !layer.leafletLayer;

        // Rename button
        const renameBtn = this.createControlButton('✏', 'Rename layer', () => {
            this.openRenameDialog(layer.config.id);
        });
        renameBtn.disabled = layer.status === 'error';

        // Style button (for GeoJSON only)
        let styleBtn = null;
        if (layer.config.type === 'geojson' && layer.status !== 'error') {
            styleBtn = this.createControlButton('🎨', 'Style layer', () => {
                this.openStyleEditor(layer.config.id);
            });
        }

        // Remove button
        const removeBtn = this.createControlButton('✕', 'Remove layer', () => {
            AppState.removeLayer(layer.config.id);
            this.updateLayersList();
        });

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        controls.appendChild(zoomBtn);
        controls.appendChild(renameBtn);
        if (styleBtn) controls.appendChild(styleBtn);
        controls.appendChild(removeBtn);

        item.appendChild(toggle);
        item.appendChild(info);
        item.appendChild(controls);

        return item;
    },

    getStatusTitle(status, error) {
        const titles = {
            'loading': 'Layer is loading...',
            'loaded': 'Layer loaded successfully',
            'error': `Layer failed to load${error ? ': ' + error : ''}`
        };
        return titles[status] || 'Unknown status';
    },

    createControlButton(text, title, onClick) {
        const btn = document.createElement('button');
        btn.className = 'layer-item-btn';
        btn.textContent = text;
        btn.title = title;
        btn.addEventListener('click', onClick);
        return btn;
    },

    // =====================================================
    // Rename Dialog
    // =====================================================

    openRenameDialog(layerId) {
        const layer = AppState.layers[layerId];
        if (!layer) return;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const title = document.createElement('h3');
        title.textContent = 'Rename Layer';
        title.className = 'modal-title';

        // Original name (read-only)
        const originalGroup = document.createElement('div');
        originalGroup.className = 'form-group';
        const originalLabel = document.createElement('label');
        originalLabel.textContent = 'Technical Name (read-only):';
        const originalValue = document.createElement('div');
        originalValue.className = 'form-value-display';
        originalValue.textContent = layer.originalName;
        originalGroup.appendChild(originalLabel);
        originalGroup.appendChild(originalValue);

        // Display name
        const displayGroup = document.createElement('div');
        displayGroup.className = 'form-group';
        const displayLabel = document.createElement('label');
        displayLabel.textContent = 'Display Name (shown in UI):';
        displayLabel.htmlFor = 'displayName-input';
        const displayInput = document.createElement('input');
        displayInput.id = 'displayName-input';
        displayInput.type = 'text';
        displayInput.className = 'form-input';
        displayInput.value = layer.displayName;
        displayInput.placeholder = 'Enter friendly name';
        displayGroup.appendChild(displayLabel);
        displayGroup.appendChild(displayInput);

        // Legend title
        const legendGroup = document.createElement('div');
        legendGroup.className = 'form-group';
        const legendLabel = document.createElement('label');
        legendLabel.textContent = 'Legend Title (optional):';
        legendLabel.htmlFor = 'legendTitle-input';
        const legendInput = document.createElement('input');
        legendInput.id = 'legendTitle-input';
        legendInput.type = 'text';
        legendInput.className = 'form-input';
        legendInput.value = layer.legendTitle || '';
        legendInput.placeholder = 'Leave blank to use display name';
        legendGroup.appendChild(legendLabel);
        legendGroup.appendChild(legendInput);

        // Buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'modal-buttons';

        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-primary';
        applyBtn.textContent = 'Apply';
        applyBtn.addEventListener('click', () => {
            const newDisplayName = displayInput.value.trim();
            const newLegendTitle = legendInput.value.trim();

            if (newDisplayName) {
                layer.displayName = newDisplayName;
                layer.legendTitle = newLegendTitle || null;

                // Update UI
                UIModule.updateLayersList();
                LegendModule.update();
            }

            document.body.removeChild(modal);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        buttonGroup.appendChild(applyBtn);
        buttonGroup.appendChild(cancelBtn);

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(originalGroup);
        modalContent.appendChild(displayGroup);
        modalContent.appendChild(legendGroup);
        modalContent.appendChild(buttonGroup);

        modal.appendChild(modalContent);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        document.body.appendChild(modal);

        // Focus on display name input
        displayInput.focus();
        displayInput.select();
    },

    // =====================================================
    // Tool Buttons
    // =====================================================

    setupToolButtons() {
        const swipeBtn = document.getElementById('swipe-toggle-btn');

        if (swipeBtn) {
            swipeBtn.addEventListener('click', () => {
                if (SwipeModule.enabled) {
                    SwipeModule.disable();
                    swipeBtn.classList.remove('active');
                    swipeBtn.textContent = 'Enable Layer Swipe';
                } else {
                    SwipeModule.enable();
                    swipeBtn.classList.add('active');
                    swipeBtn.textContent = 'Disable Layer Swipe';
                }
            });
        }
    },

    setupDashboardManagement() {
        const exportBtn = document.getElementById('export-config-btn');
        const resetConfigBtn = document.getElementById('reset-config-btn');
        const clearLocalBtn = document.getElementById('clear-local-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDashboardConfig();
            });
        }

        if (resetConfigBtn) {
            resetConfigBtn.addEventListener('click', () => {
                if (confirm('Reset dashboard to project configuration (data/dashboard-config.json)? Your local changes will be cleared.')) {
                    Storage.reset();
                    location.reload();
                }
            });
        }

        if (clearLocalBtn) {
            clearLocalBtn.addEventListener('click', () => {
                if (confirm('Clear all local browser changes? This will keep the project configuration but remove your custom layers and preferences.')) {
                    Storage.reset();
                    location.reload();
                }
            });
        }
    },

    exportDashboardConfig() {
        const map = MapModule.getMap();
        const legendPanel = document.querySelector('.legend-panel');
        const config = {
            title: 'Geo Dashboard',
            description: 'Interactive geographic data visualization and analysis',
            initialMap: {
                center: [map.getCenter().lat, map.getCenter().lng],
                zoom: map.getZoom()
            },
            activeBasemap: MapModule.getActiveBasemapId(),
            theme: document.documentElement.getAttribute('data-theme') || 'light',
            layers: {
                visibleLayers: Object.fromEntries(
                    Object.entries(AppState.layers).map(([id, layer]) => [id, layer.visible])
                ),
                layerOrder: Object.keys(AppState.layers).sort((a, b) =>
                    (AppState.layers[b].order || 0) - (AppState.layers[a].order || 0)
                ),
                layerOpacity: Object.fromEntries(
                    Object.entries(AppState.layers).map(([id, layer]) => [id, layer.opacity])
                )
            },
            layerStyles: Object.fromEntries(
                Object.entries(AppState.layers)
                    .filter(([_, layer]) => layer.customStyle)
                    .map(([id, layer]) => [id, layer.customStyle])
            ),
            layerDisplayNames: Object.fromEntries(
                Object.entries(AppState.layers)
                    .filter(([_, layer]) => layer.displayName && layer.displayName !== layer.config.name && layer.displayName !== layer.config.id)
                    .map(([id, layer]) => [id, layer.displayName])
            ),
            layerLegendTitles: Object.fromEntries(
                Object.entries(AppState.layers)
                    .filter(([_, layer]) => layer.legendTitle)
                    .map(([id, layer]) => [id, layer.legendTitle])
            ),
            swipe: {
                enabled: SwipeModule.enabled,
                leftLayer: SwipeModule.layer1Id || null,
                rightLayer: SwipeModule.layer2Id || null
            },
            legend: {
                collapsed: legendPanel?.classList.contains('collapsed') || false
            },
            panels: {
                activeTab: document.querySelector('.tab-btn.active')?.dataset.tab || 'layers',
                layersCollapsed: false,
                indicatorsCollapsed: false
            },
            bookmarks: Storage.getBookmarks(),
            buffers: BufferModule.exportBuffers()
        };

        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // =====================================================
    // Style Editor
    // =====================================================

    openStyleEditor(layerId) {
        const layer = AppState.layers[layerId];
        if (!layer || layer.config.type !== 'geojson') return;

        const modal = document.createElement('div');
        modal.className = 'style-modal';
        modal.innerHTML = `<div class="style-modal-overlay"></div>`;

        const content = document.createElement('div');
        content.className = 'style-modal-content';

        const header = document.createElement('div');
        header.className = 'style-modal-header';
        header.innerHTML = `
            <h3>Style: ${layer.config.name}</h3>
            <button class="btn btn-icon" title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        const closeBtn = header.querySelector('button');
        closeBtn.addEventListener('click', () => modal.remove());

        const body = document.createElement('div');
        body.className = 'style-modal-body';

        const styleConfig = layer.customStyle || layer.config.style || {};
        const stylePanel = this.createStylePanel(layerId, layer.config, styleConfig, layer._geodashboard_data?.features || []);
        body.appendChild(stylePanel);

        const footer = document.createElement('div');
        footer.className = 'style-modal-footer';
        footer.innerHTML = `
            <button class="btn btn-secondary" id="style-reset-btn">Reset to Default</button>
            <div>
                <button class="btn btn-secondary" id="style-cancel-btn">Cancel</button>
                <button class="btn btn-primary" id="style-apply-btn">Apply</button>
            </div>
        `;

        footer.querySelector('#style-cancel-btn').addEventListener('click', () => modal.remove());
        footer.querySelector('#style-reset-btn').addEventListener('click', () => {
            layer.customStyle = null;
            AppState.layers[layerId].customStyle = null;
            LayersModule.reapplyStyle(layer.leafletLayer, layer.config.style);
            LegendModule.update();
            modal.remove();
        });

        footer.querySelector('#style-apply-btn').addEventListener('click', () => {
            const styleObj = this.collectStyleFromPanel(stylePanel);
            this.applyStyleToLayer(layerId, styleObj);
            modal.remove();
        });

        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Close on overlay click
        modal.querySelector('.style-modal-overlay').addEventListener('click', () => modal.remove());
    },

    createStylePanel(layerId, config, styleConfig, features) {
        const panel = document.createElement('div');
        panel.className = 'style-panel';

        const mode = styleConfig.mode || 'single';

        // Mode selector
        const modeGroup = document.createElement('div');
        modeGroup.className = 'style-control-group';
        modeGroup.innerHTML = `<label>Style Mode</label>`;

        const modeOptions = document.createElement('div');
        modeOptions.className = 'style-mode-selector';

        ['single', 'category', 'graduated'].forEach(m => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="radio" name="style-mode" value="${m}" ${m === mode ? 'checked' : ''}>
                <span>${m.charAt(0).toUpperCase() + m.slice(1)}</span>
            `;
            modeOptions.appendChild(label);
        });

        modeGroup.appendChild(modeOptions);
        panel.appendChild(modeGroup);

        // Mode-specific controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'style-controls-container';
        controlsContainer.dataset.mode = mode;

        if (mode === 'single') {
            controlsContainer.appendChild(this.createSingleStyleControls(styleConfig));
        } else if (mode === 'category') {
            controlsContainer.appendChild(this.createCategoryStyleControls(styleConfig, features));
        } else if (mode === 'graduated') {
            controlsContainer.appendChild(this.createGraduatedStyleControls(styleConfig, features));
        }

        panel.appendChild(controlsContainer);

        // Mode change handler
        modeOptions.querySelectorAll('input').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const newMode = e.target.value;
                controlsContainer.dataset.mode = newMode;

                // Replace controls based on new mode
                while (controlsContainer.firstChild) {
                    controlsContainer.removeChild(controlsContainer.firstChild);
                }

                if (newMode === 'single') {
                    controlsContainer.appendChild(this.createSingleStyleControls({}));
                } else if (newMode === 'category') {
                    controlsContainer.appendChild(this.createCategoryStyleControls({}, features));
                } else if (newMode === 'graduated') {
                    controlsContainer.appendChild(this.createGraduatedStyleControls({}, features));
                }
            });
        });

        return panel;
    },

    createSingleStyleControls(styleConfig) {
        const container = document.createElement('div');
        container.className = 'style-single-controls';

        const fillColor = styleConfig.fillColor || '#3388ff';
        const color = styleConfig.color || '#0044aa';
        const fillOpacity = (styleConfig.fillOpacity !== undefined) ? styleConfig.fillOpacity : 0.4;
        const opacity = (styleConfig.opacity !== undefined) ? styleConfig.opacity : 1;
        const weight = styleConfig.weight || 2;

        container.innerHTML = `
            <div class="style-control-group">
                <label>Fill Color</label>
                <input type="color" class="color-input fill-color" value="${fillColor}">
            </div>
            <div class="style-control-group">
                <label>Outline Color</label>
                <input type="color" class="color-input outline-color" value="${color}">
            </div>
            <div class="style-control-group">
                <label>Fill Opacity: <span class="opacity-value">${(fillOpacity * 100).toFixed(0)}%</span></label>
                <input type="range" class="opacity-slider fill-opacity" min="0" max="100" value="${fillOpacity * 100}">
            </div>
            <div class="style-control-group">
                <label>Outline Opacity: <span class="opacity-value">${(opacity * 100).toFixed(0)}%</span></label>
                <input type="range" class="opacity-slider outline-opacity" min="0" max="100" value="${opacity * 100}">
            </div>
            <div class="style-control-group">
                <label>Outline Width</label>
                <input type="number" class="numeric-input weight" min="0" max="10" step="0.5" value="${weight}">
            </div>
        `;

        // Update opacity display on input
        container.querySelectorAll('.opacity-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const label = e.target.closest('.style-control-group').querySelector('.opacity-value');
                if (label) label.textContent = `${e.target.value}%`;
            });
        });

        return container;
    },

    createCategoryStyleControls(styleConfig, features) {
        const container = document.createElement('div');
        container.className = 'style-category-controls';

        const field = styleConfig.field || '';
        const categories = styleConfig.categories || {};
        const defaultStyle = styleConfig.default || { fillColor: '#cccccc', color: '#666666' };

        // Get unique field values from features
        const uniqueValues = field ? StylesModule.getUniqueValues(features, field) : [];

        container.innerHTML = `
            <div class="style-control-group">
                <label>Category Field</label>
                <select class="form-input category-field">
                    <option value="">-- Select field --</option>
                </select>
            </div>
            <div class="style-control-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label>Categories</label>
                    <button class="btn btn-small random-colors-btn" title="Generate random colors">🎲 Random Colors</button>
                </div>
                <div class="categories-list"></div>
            </div>
            <div class="style-control-group">
                <label>Default Style</label>
                <div class="style-control-subgroup">
                    <label>Fill Color</label>
                    <input type="color" class="color-input default-fill" value="${defaultStyle.fillColor || '#cccccc'}">
                </div>
                <div class="style-control-subgroup">
                    <label>Outline Color</label>
                    <input type="color" class="color-input default-outline" value="${defaultStyle.color || '#666666'}">
                </div>
            </div>
        `;

        // Populate field selector
        const fieldSelect = container.querySelector('.category-field');
        const fieldNames = features.length > 0 ? Object.keys(features[0].properties || {}) : [];
        fieldNames.forEach(fname => {
            const option = document.createElement('option');
            option.value = fname;
            option.textContent = fname;
            if (fname === field) option.selected = true;
            fieldSelect.appendChild(option);
        });

        const categoriesList = container.querySelector('.categories-list');
        const randomColorsBtn = container.querySelector('.random-colors-btn');

        const updateCategories = () => {
            const selectedField = fieldSelect.value;
            categoriesList.innerHTML = '';

            if (!selectedField) return;

            const values = StylesModule.getUniqueValues(features, selectedField);
            values.forEach(value => {
                const catStyle = categories[value] || { fillColor: '#3388ff', color: '#0044aa', enabled: true, fillOpacity: 0.4 };
                const catDiv = document.createElement('div');
                catDiv.className = 'category-item';
                catDiv.innerHTML = `
                    <div class="category-item-header">
                        <input type="checkbox" class="category-enabled" ${catStyle.enabled !== false ? 'checked' : ''} data-value="${value}">
                        <span class="category-label">${value}</span>
                    </div>
                    <div class="category-item-controls">
                        <div class="category-control">
                            <label title="Fill Color">Fill</label>
                            <input type="color" class="color-input cat-fill" value="${catStyle.fillColor || '#3388ff'}" data-value="${value}">
                        </div>
                        <div class="category-control">
                            <label title="Fill Opacity">${(catStyle.fillOpacity !== undefined ? (catStyle.fillOpacity * 100).toFixed(0) : 40)}%</label>
                            <input type="range" class="opacity-input cat-fill-opacity" min="0" max="100" value="${catStyle.fillOpacity !== undefined ? catStyle.fillOpacity * 100 : 40}" data-value="${value}">
                        </div>
                        <div class="category-control">
                            <label title="Outline Color">Outline</label>
                            <input type="color" class="color-input cat-outline" value="${catStyle.color || '#0044aa'}" data-value="${value}">
                        </div>
                    </div>
                `;
                categoriesList.appendChild(catDiv);

                // Update opacity label on change
                const opacitySlider = catDiv.querySelector('.cat-fill-opacity');
                const opacityLabel = catDiv.querySelector('.category-control:nth-child(2) label');
                opacitySlider.addEventListener('input', (e) => {
                    opacityLabel.textContent = `${e.target.value}%`;
                });
            });
        };

        randomColorsBtn.addEventListener('click', () => {
            const selectedField = fieldSelect.value;
            if (!selectedField) return;

            const values = StylesModule.getUniqueValues(features, selectedField);
            const palette = StylesModule.createColorPalette('categorical', values.length);

            values.forEach((value, index) => {
                const fillColorInput = categoriesList.querySelector(`.cat-fill[data-value="${value}"]`);
                if (fillColorInput) {
                    fillColorInput.value = palette[index];
                }
            });
        });

        fieldSelect.addEventListener('change', updateCategories);
        updateCategories();

        return container;
    },

    createGraduatedStyleControls(styleConfig, features) {
        const container = document.createElement('div');
        container.className = 'style-graduated-controls';

        const field = styleConfig.field || '';
        const classCount = styleConfig.classes || 5;
        const palette = styleConfig.palette || 'sequential';
        const paletteType = palette.split('.')[0];

        // Get numeric fields
        const numericFields = features.length > 0
            ? Object.keys(features[0].properties || {}).filter(key => {
                const values = features.map(f => f.properties?.[key]);
                return values.some(v => !isNaN(v) && v !== null && v !== '');
            })
            : [];

        container.innerHTML = `
            <div class="style-control-group">
                <label>Data Field</label>
                <select class="form-input graduated-field">
                    <option value="">-- Select numeric field --</option>
                </select>
            </div>
            <div class="style-control-group">
                <label>Number of Classes: <span class="class-count">${classCount}</span></label>
                <input type="range" class="numeric-input class-count-slider" min="2" max="7" value="${classCount}">
            </div>
            <div class="style-control-group">
                <label>Palette Type</label>
                <select class="form-input palette-type">
                    <option value="sequential" ${paletteType === 'sequential' ? 'selected' : ''}>Sequential</option>
                    <option value="categorical" ${paletteType === 'categorical' ? 'selected' : ''}>Categorical</option>
                    <option value="diverging" ${paletteType === 'diverging' ? 'selected' : ''}>Diverging</option>
                </select>
            </div>
            <div class="style-control-group">
                <label>Color Palette</label>
                <div class="palette-preview"></div>
            </div>
        `;

        // Populate field selector
        const fieldSelect = container.querySelector('.graduated-field');
        numericFields.forEach(fname => {
            const option = document.createElement('option');
            option.value = fname;
            option.textContent = fname;
            if (fname === field) option.selected = true;
            fieldSelect.appendChild(option);
        });

        const classCountSlider = container.querySelector('.class-count-slider');
        const classCountLabel = container.querySelector('.class-count');
        classCountSlider.addEventListener('input', (e) => {
            classCountLabel.textContent = e.target.value;
        });

        return container;
    },

    collectStyleFromPanel(panel) {
        const mode = panel.querySelector('input[name="style-mode"]:checked').value;
        const styleObj = { mode };

        if (mode === 'single') {
            styleObj.fillColor = panel.querySelector('.fill-color').value;
            styleObj.color = panel.querySelector('.outline-color').value;
            styleObj.fillOpacity = parseFloat(panel.querySelector('.fill-opacity').value) / 100;
            styleObj.opacity = parseFloat(panel.querySelector('.outline-opacity').value) / 100;
            styleObj.weight = parseFloat(panel.querySelector('.weight').value);
        } else if (mode === 'category') {
            const field = panel.querySelector('.category-field').value;
            styleObj.field = field;
            styleObj.categories = {};

            panel.querySelectorAll('.category-item').forEach(item => {
                const value = item.querySelector('.cat-fill').dataset.value;
                const fillColor = item.querySelector('.cat-fill').value;
                const color = item.querySelector('.cat-outline').value;
                const enabled = item.querySelector('.category-enabled').checked;
                const fillOpacity = parseFloat(item.querySelector('.cat-fill-opacity').value) / 100;
                styleObj.categories[value] = { fillColor, color, enabled, fillOpacity };
            });

            styleObj.default = {
                fillColor: panel.querySelector('.default-fill').value,
                color: panel.querySelector('.default-outline').value
            };
        } else if (mode === 'graduated') {
            styleObj.field = panel.querySelector('.graduated-field').value;
            styleObj.classes = parseInt(panel.querySelector('.class-count-slider').value);
            styleObj.palette = panel.querySelector('.palette-type').value;
        }

        return styleObj;
    },

    applyStyleToLayer(layerId, styleObj) {
        const layer = AppState.layers[layerId];
        if (!layer || !layer.leafletLayer) return;

        layer.customStyle = styleObj;
        LayersModule.reapplyStyle(layer.leafletLayer, styleObj);
        LegendModule.update();
        UIModule.updateLayersList();
    },

    // =====================================================
    // Catalog Modal (for adding layers to project)
    // =====================================================

    showCatalogModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';

        // Title
        const title = document.createElement('h2');
        title.className = 'modal-title';
        title.textContent = 'Add Layers from Catalog';

        // Layers list
        const layersContainer = document.createElement('div');
        layersContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        // Get current project layers
        const projectLayerIds = AppState.projectConfig?.visibleLayers
            ? Object.keys(AppState.projectConfig.visibleLayers)
            : [];

        // Get all catalog layers grouped by category
        const grouped = {};
        Object.values(AppState.layers).forEach(layer => {
            const group = layer.config.group || 'My Layers';
            if (!grouped[group]) {
                grouped[group] = [];
            }
            grouped[group].push(layer);
        });

        // Render each group
        Object.entries(grouped).forEach(([groupName, groupLayers]) => {
            const groupDiv = document.createElement('div');
            groupDiv.style.cssText = 'margin-bottom: 12px;';

            const groupTitle = document.createElement('div');
            groupTitle.style.cssText = 'font-weight: 600; font-size: 12px; color: var(--color-text-muted); margin-bottom: 6px;';
            groupTitle.textContent = groupName;
            groupDiv.appendChild(groupTitle);

            groupLayers.forEach(layer => {
                const layerDiv = document.createElement('div');
                layerDiv.style.cssText = 'display: flex; align-items: center; padding: 8px; background: var(--color-bg-secondary); border-radius: 4px;';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = layer.config.id;
                checkbox.checked = projectLayerIds.includes(layer.config.id);
                checkbox.style.marginRight = '8px';
                checkbox.dataset.layerId = layer.config.id;

                const label = document.createElement('label');
                label.style.cssText = 'flex: 1; cursor: pointer; margin: 0;';
                label.innerHTML = `
                    <div style="font-size: 13px;">${layer.displayName}</div>
                    ${layer.config.description ? `<div style="font-size: 11px; color: var(--color-text-muted);">${layer.config.description}</div>` : ''}
                `;

                layerDiv.appendChild(checkbox);
                layerDiv.appendChild(label);

                // Make the label clickable to toggle checkbox
                label.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                });

                groupDiv.appendChild(layerDiv);
            });

            layersContainer.appendChild(groupDiv);
        });

        // Buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'modal-buttons';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'modal-btn-primary';
        addBtn.textContent = 'Add Selected Layers';
        addBtn.addEventListener('click', async () => {
            const checkboxes = Array.from(layersContainer.querySelectorAll('input[type="checkbox"]'));
            const selectedLayerIds = checkboxes.filter(cb => cb.checked).map(cb => cb.value);

            // Update project config with new layers
            if (!AppState.projectConfig) {
                AppState.projectConfig = { visibleLayers: {} };
            }

            // Add selected layers to visible layers
            selectedLayerIds.forEach(layerId => {
                AppState.projectConfig.visibleLayers[layerId] = true;

                // Activate layer if not already loaded
                const layer = AppState.layers[layerId];
                if (layer && layer.status === 'available') {
                    AppState.activateLayer(layerId).catch(error => {
                        console.error(`Failed to activate layer ${layerId}:`, error);
                    });
                } else if (layer && !layer.visible) {
                    AppState.setLayerVisibility(layerId, true);
                }
            });

            // Refresh UI
            UIModule.updateLayersList();
            ChartsModule.updateIndicators();
            LegendModule.update();

            document.body.removeChild(modal);
        });

        buttonGroup.appendChild(cancelBtn);
        buttonGroup.appendChild(addBtn);

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(layersContainer);
        modalContent.appendChild(buttonGroup);

        modal.appendChild(modalContent);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        document.body.appendChild(modal);
    }
};
