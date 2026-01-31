import json

# Read TopoJSON
with open('/home/ubuntu/jakarta-topo.json', 'r') as f:
    topo = json.load(f)

# Get transform and arcs
transform = topo['transform']
scale = transform['scale']
translate = transform['translate']
arcs = topo['arcs']

# Decode arcs to absolute coordinates
decoded_arcs = []
for arc in arcs:
    decoded = []
    x, y = 0, 0
    for point in arc:
        x += point[0]
        y += point[1]
        decoded.append([
            x * scale[0] + translate[0],
            y * scale[1] + translate[1]
        ])
    decoded_arcs.append(decoded)

print(f"Decoded {len(decoded_arcs)} arcs")

def get_arc(index):
    """Get arc coordinates, reversing if index is negative"""
    if index >= 0:
        return decoded_arcs[index][:]
    else:
        return list(reversed(decoded_arcs[~index]))

def decode_ring(arc_indices):
    """Decode a ring (list of arc indices) to coordinates"""
    coords = []
    for idx in arc_indices:
        arc_coords = get_arc(idx)
        if coords and len(coords) > 0:
            # Skip first point if it matches last point (shared vertex)
            if arc_coords[0] == coords[-1]:
                arc_coords = arc_coords[1:]
        coords.extend(arc_coords)
    # Close the ring
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords

# District colors and names mapping
district_info = {
    'Jakarta Selatan': {'color': '#6FCF97', 'letter': 'E', 'name': 'South Jakarta'},
    'Jakarta Timur': {'color': '#FFE66D', 'letter': 'D', 'name': 'East Jakarta'},
    'Jakarta Pusat': {'color': '#A78BFA', 'letter': 'C', 'name': 'Central Jakarta'},
    'Jakarta Barat': {'color': '#FF6B6B', 'letter': 'A', 'name': 'West Jakarta'},
    'Jakarta Utara': {'color': '#4ECDC4', 'letter': 'B', 'name': 'North Jakarta'},
}

# Convert geometries to GeoJSON features
features = []
objects = topo['objects']['jakarta']['geometries']

for geom in objects:
    kabkot = geom['properties']['kabkot']
    info = district_info.get(kabkot, {})
    
    if geom['type'] == 'Polygon':
        rings = []
        for ring_indices in geom['arcs']:
            ring_coords = decode_ring(ring_indices)
            rings.append(ring_coords)
        geometry = {'type': 'Polygon', 'coordinates': rings}
    elif geom['type'] == 'MultiPolygon':
        polygons = []
        for polygon_arcs in geom['arcs']:
            rings = []
            for ring_indices in polygon_arcs:
                ring_coords = decode_ring(ring_indices)
                rings.append(ring_coords)
            polygons.append(rings)
        geometry = {'type': 'MultiPolygon', 'coordinates': polygons}
    
    feature = {
        'type': 'Feature',
        'properties': {
            'name': info.get('name', kabkot),
            'nameId': kabkot,
            'letter': info.get('letter', ''),
            'color': info.get('color', '#888888')
        },
        'geometry': geometry
    }
    features.append(feature)
    
    # Debug: print first few coords
    if geometry['type'] == 'Polygon':
        print(f"{kabkot}: {len(geometry['coordinates'][0])} points, first 2: {geometry['coordinates'][0][:2]}")

geojson = {
    'type': 'FeatureCollection',
    'features': features
}

# Save
with open('/home/ubuntu/comm-at/client/public/jakarta-real-boundaries.json', 'w') as f:
    json.dump(geojson, f)

print(f"\nSaved {len(features)} features to jakarta-real-boundaries.json")
