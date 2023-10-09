# import os
# from pprint import pprint
# import re
# import json
# import yaml
# def get_all_filePaths(folderPath):
#     result = []
#     for dirpath, dirnames, filenames in os.walk(folderPath):
#         result.extend([os.path.join(dirpath, filename) for filename in filenames])
#     return result
  
# def get(path):
#   with open(path, "r", encoding="utf8") as file:
#     return file.read().strip()
  
# def save(file_path, data):
#   with open(file_path, "w") as json_file:
#     json.dump(data, json_file)  
    
# files = get_all_filePaths("content/")

# for file in files:

#   # if "ethan-morales" not in file: continue
#   data = get(file)
#   md = data.split("-"*70)
  
#   master = {"areas": {

#   }}
  
#   is_preview = False
#   for area in md:
#     # if area.strip() == "":
#     #   continue
    
#     profile = ""
#     body = ""
#     tabs = {}
    
#     output = {}
    
#     # Check if theres a profile in it
#     if ("="*29) in area:
#       raw = area.split("="*29)
#       profile = yaml.safe_load(raw[1].strip())
#       body = raw[2].strip()
      
#       pprint(profile)
#     else:
#       body = area.strip()
      
    
#     found_tabs = re.split(r"\=\=\=(.*?)\=\=\=", body)[1:]
#     if found_tabs:
#       for i in range(0, len(found_tabs), 2):
#         tab_name = found_tabs[i]
#         tab_content = found_tabs[i+1]
        
#         tabs[tab_name] = tab_content.strip()
#     else:
#       tabs = {
#         "default": body
#       }


#     if profile != "":
#       output["profile"] = profile
      
#     output["tabs"] = tabs
    
#     if "full" not in master["areas"]:
#       master["areas"]["full"] = output
#     else:
#       master["areas"]['preview'] = output
#   # pprint(master)


  
#   save(file.replace(".md", ".json"), master)
#   os.remove(file)
#   print("done", file)