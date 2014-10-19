import json
import pdb
import itertools
import pymongo
from shapely.geometry import LineString

conn = pymongo.Connection('mongodb://evan:Sk8board@ds047050.mongolab.com:47050/kingoftheblock')

db = conn['kingoftheblock']

def find_intersections(coord_pairs):

  line1 = LineString(coord_pairs[0])
  line2 = LineString(coord_pairs[1])
 
  return line1.intersection(line2)

if __name__ == "__main__":

  json_data=open('utils/vectile-highroad.json')
  data = json.load(json_data)
  json_data.close()

  all_coords = [feature['geometry'] for feature in data['features']]    
  filtered_coords = [coord['coordinates'] for coord in all_coords if coord['type'] != "MultiLineString"]

  all_line_pairs = list(itertools.combinations(filtered_coords, 2))
  intersections = []
  
  for coord_pairs in all_line_pairs:    
    intersect_point = find_intersections(list(coord_pairs))    
  
    if not intersect_point.is_empty:
      try:
        intersect_coords = intersect_point.coords[0]
      except NotImplementedError:
        print "error"
      if intersect_coords:
        obj = {"loc":[intersect_coords[0],intersect_coords[1]]}
        db.intersections.insert(obj)

  
