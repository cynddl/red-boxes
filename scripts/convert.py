import json
from tqdm import tqdm


def fix_time(ts, postfix="week"):
    if ts == "":
        return {"ts_" + postfix: None}

    ts_h, ts_m = ts.split(":")
    return {"ts_" + postfix: int(ts_h) * 60 + int(ts_m)}


def convert_marker(m):
    if not isinstance(m, dict):
        return None

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



if __name__ == '__main__':
    with open("raw_markers.json", "r") as fo, open("markers.geojson", "w") as fw:
        markers = json.load(fo)["marker"]

        geo_markers = [convert_marker(m) for m in tqdm(markers)]
        geo_markers = [g for g in geo_markers if g is not None]
        print("Processed %i markers." % len(geo_markers))


        out_json = {
            "type": "FeatureCollection",
            # "crs": {"type": "name", "properties": {"name": "redboxes"}},
            "features": geo_markers
        }
        json.dump(out_json, fw, ensure_ascii=False)
