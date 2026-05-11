// Carregador PMTiles - Exponha a biblioteca globalmente
(function() {
  'use strict';

  // Flag para indicar que estamos carregando
  window._pmtilesLoading = true;
  window._pmtilesReady = false;
  window._pmtilesError = null;

  // IIFE assíncrona para carregar o módulo
  (async function() {
    try {
      console.log('[pmtiles-loader] Iniciando carregamento da biblioteca PMTiles...');

      // Importar o módulo PMTiles do caminho correto
      const pmtilesModule = await import('./vendor/pmtiles/pmtiles.js');

      console.log('[pmtiles-loader] Módulo importado com sucesso');
      console.log('[pmtiles-loader] Exports disponíveis:', Object.keys(pmtilesModule));

      // Verificar se os exports obrigatórios existem
      if (!pmtilesModule.PMTiles) {
        throw new Error('PMTiles export não encontrado no módulo');
      }
      if (!pmtilesModule.Protocol) {
        throw new Error('Protocol export não encontrado no módulo');
      }

      // Expor globalmente
      window.pmtiles = {
        PMTiles: pmtilesModule.PMTiles,
        Protocol: pmtilesModule.Protocol,
        FetchSource: pmtilesModule.FetchSource || null,
        FileSource: pmtilesModule.FileSource || null,
        leafletRasterLayer: pmtilesModule.leafletRasterLayer || null,
        // Exports adicionais para compatibilidade
        Compression: pmtilesModule.Compression || null,
        TileType: pmtilesModule.TileType || null
      };

      console.log('[pmtiles-loader] ✓ window.pmtiles criado com sucesso');
      console.log('[pmtiles-loader] Objetos disponíveis:', {
        PMTiles: !!window.pmtiles.PMTiles,
        Protocol: !!window.pmtiles.Protocol,
        FetchSource: !!window.pmtiles.FetchSource
      });

      // Sinalizar sucesso
      window._pmtilesReady = true;
      window._pmtilesLoading = false;

      // Disparar evento customizado para notificar a aplicação
      window.dispatchEvent(new CustomEvent('pmtiles-ready'));

      console.log('[pmtiles-loader] ✓ PMTiles pronto para usar');

    } catch (error) {
      console.error('[pmtiles-loader] ✗ Erro ao carregar PMTiles:', error);
      console.error('[pmtiles-loader] Mensagem:', error.message);
      console.error('[pmtiles-loader] Stack:', error.stack);

      window._pmtilesError = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
      window._pmtilesLoading = false;

      // Disparar evento de erro
      window.dispatchEvent(new CustomEvent('pmtiles-error', { detail: error }));
    }
  })();
})();
