const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getStockQuote: (symbol, market) =>
    ipcRenderer.invoke('stock:getQuote', symbol, market),
  searchStocks: (query) =>
    ipcRenderer.invoke('stock:search', query),
  isElectron: true,
})
