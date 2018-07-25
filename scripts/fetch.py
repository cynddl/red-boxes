import json
import requests
from tqdm import tqdm
import xmltodict
import time, random


def chunks(l, n):
    """Yield successive n-sized chunks from l."""
    for i in range(0, len(l), n):
        yield l[i:i + n]

def fetch_markers(zip):
    URL_BASE = "http://www.bpost2.be/redboxes/fr/get_zone_zip.php"
    r = requests.get(URL_BASE, params={'zip': ','.join(zip)})

    r.raise_for_status()  # Raise an exception if the status code is not OK
    d = xmltodict.parse(r.content)

    if d is None or d['markers'] is None or d['markers']['marker'] is None:
        return []
    return d['markers']['marker']


if __name__ == '__main__':
    with open('zipcodes.txt', 'r') as f:
        ZIPCODES = f.readlines()[0].split(',')

    boxes = []
    for z in tqdm(chunks(ZIPCODES, 100), total=1 + len(ZIPCODES) // 100):
        boxes.extend(fetch_markers(z))
        time.sleep(random.random() / 10)

    with open('raw_markers.json', 'w') as f:
        s = json.dumps({'marker': boxes}, ensure_ascii=False)
        f.write(s.replace('"@', '"'))  # remove @ symbol, for XML props
