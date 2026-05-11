// Wrapper to make pmtiles available globally via ES module import
import { PMTiles, Protocol } from './pmtiles.js';

window.pmtiles = {
  PMTiles,
  Protocol
};
