import json
from pprint import pprint

data = {}
with open("Project\.lore\metadata.json", "r", encoding="utf8") as f:
  data = json.load(f)
  
  for entry in data["directory"]:
    data["directory"][entry]["tags"] = ""
  
with open("Project\.lore\metadata.json", "w", encoding="utf8") as f:
  json.dump(data, f, indent=2, ensure_ascii=False, )