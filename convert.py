import json
from tqdm import tqdm


def fix_time(ts, postfix="week"):
    if ts == "":
        return {
            "hours_" + postfix: None,
            "minutes_" + postfix: None
        }
    else:
        return {
            "hours_" + postfix: ts[:2],
            "minutes_" + postfix: ts[3:]
        }


def convert_marker(m):
    rv = {
        "type": "Feature",
        "properties": {
            "id": m["id"],
            "address_fr": "{address1_fr}\n{address2_fr}".format(**m),
            "status": m["status"]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [float(m["lng"]), float(m["lat"])]
        }
    }
    rv["properties"].update(fix_time(m["sat"], "sat"))
    rv["properties"].update(fix_time(m["week"], "week"))
    return rv


with open("raw_markers.json", "r") as fo, open("assets/markers.geojson", "w") as fw:
    markers = json.load(fo)["marker"]

    out_json = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "redboxes"}},
        "features": [convert_marker(m) for m in tqdm(markers)]
    }
    json.dump(out_json, fw, indent=4)
