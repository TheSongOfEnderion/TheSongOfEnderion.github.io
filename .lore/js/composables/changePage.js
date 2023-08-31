function changePage(name, id, path) {
  const url = new URL(window.location);
  
  url.searchParams.set("p", id.replace(" ", "-").toLowerCase());
  history.pushState({}, "", url);

  console.log(name, path)

  // Reload vue page
  root.reload(path, "404", name)
}