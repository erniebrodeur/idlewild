// Cache busting helper - forces browser refresh for development
(function() {
  const BUILD_TIME = '__BUILD_TIME__';
  const CACHE_KEY = 'idlewild-build-time';
  
  const lastBuildTime = localStorage.getItem(CACHE_KEY);
  if (lastBuildTime && lastBuildTime !== BUILD_TIME) {
    console.log('New build detected, clearing caches...');
    
    // Clear localStorage (except save data)
    const saveData = localStorage.getItem('idlewild:v2');
    localStorage.clear();
    if (saveData) {
      localStorage.setItem('idlewild:v2', saveData);
    }
    
    // Force page reload
    window.location.reload(true);
  }
  
  localStorage.setItem(CACHE_KEY, BUILD_TIME);
})();