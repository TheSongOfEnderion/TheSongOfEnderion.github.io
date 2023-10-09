import json
from pprint import pprint

with open("Project\.lore\metadata.json", "r", encoding="utf8") as f:
  data = json.load(f)
  
  for entry in data["directory"]:
    data["directory"][entry]["tags"] = ""
  
  pprint(data)