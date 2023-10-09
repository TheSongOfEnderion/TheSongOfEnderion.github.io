async function fetchData(url) {

  const resp = await fetch(url, {cache: "no-store"}) // cache no store added because backend pywebview is caching fetch and not updating when newly saved
  if (resp.status === 404) {
    return "Error"
  }
  return await resp.json()
}