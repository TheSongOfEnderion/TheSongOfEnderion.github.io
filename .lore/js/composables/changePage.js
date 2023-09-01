function changePage(pageId) {
  
  const url = new URL(window.location);  
  url.searchParams.set("p", pageId);
  history.replaceState(null, null, ' ');
  history.pushState({}, "", url);
  
  // Reload vue page
  root.reload(pageId)
}