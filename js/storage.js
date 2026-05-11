/**
 * Storage Module - Handle localStorage for browser preferences only
 *
 * IMPORTANT: localStorage stores only TEMPORARY browser preferences, not official project state.
 *
 * Official project state comes from:
 * - data/dashboard-config.json (layer visibility, opacity, basemap, theme, map position)
 * - data/layers-config.json (layer configuration)
 * - data/basemaps-config.json (basemap configuration)
 *
 * localStorage stores:
 * - theme: user's chosen theme (light/dark)
 * - custom layers: temporary layers added via "Add temporary layer by URL"
 * - bookmarks: saved map views
 *
 * localStorage does NOT store:
 * - layer visibility/opacity for config layers (always use dashboard-config.json)
 * - layer order for config layers (always use dashboard-config.json)
 */

const Storage = {
    KEY_THEME: 'geodashboard_theme',
    KEY_LAYERS: 'geodashboard_layers',
    KEY_BOOKMARKS: 'geodashboard_bookmarks',

    // Theme (browser preference)
    getTheme() {
        return localStorage.getItem(this.KEY_THEME) || 'dark';
    },

    setTheme(theme) {
        localStorage.setItem(this.KEY_THEME, theme);
    },

    // Custom Layers (temporary layers added by URL)
    getLayers() {
        const layers = localStorage.getItem(this.KEY_LAYERS);
        return layers ? JSON.parse(layers) : [];
    },

    setLayers(layers) {
        localStorage.setItem(this.KEY_LAYERS, JSON.stringify(layers));
    },

    addLayer(layer) {
        const layers = this.getLayers();
        layers.push(layer);
        this.setLayers(layers);
    },

    removeLayer(layerId) {
        const layers = this.getLayers();
        const filtered = layers.filter(l => l.id !== layerId);
        this.setLayers(filtered);
    },

    // Bookmarks (saved map views)
    getBookmarks() {
        const bookmarks = localStorage.getItem(this.KEY_BOOKMARKS);
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    addBookmark(bookmark) {
        const bookmarks = this.getBookmarks();
        bookmarks.push(bookmark);
        localStorage.setItem(this.KEY_BOOKMARKS, JSON.stringify(bookmarks));
    },

    removeBookmark(bookmarkId) {
        const bookmarks = this.getBookmarks();
        const filtered = bookmarks.filter(b => b.id !== bookmarkId);
        localStorage.setItem(this.KEY_BOOKMARKS, JSON.stringify(filtered));
    },

    // Clear temporary data
    reset() {
        localStorage.removeItem(this.KEY_LAYERS);
    }
};
