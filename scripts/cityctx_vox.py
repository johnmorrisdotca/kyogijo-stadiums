"""Land cover for the areas of scripts/cityctx.data.json, made with VoxCity (https://github.com/kunifujiwara/VoxCity, MIT) run locally.

    python3.13 -m venv .venv-vox && .venv-vox/bin/pip install voxcity
    .venv-vox/bin/python -I scripts/cityctx_vox.py [YYYY-MM-DD] [area-id]      (or: pnpm cityctx:vox)

It needs the network, Python 3.10 to 3.13 and no account: only VoxCity's own `get_land_cover_grid` with the source `OpenStreetMap` is used (OpenStreetMap through Overpass, ODbL 1.0).
VoxCity's other sources for land cover and for tree canopy height (ESA WorldCover, ESRI, Dynamic World, Meta's and ETH's canopy maps) need a Google Earth Engine account and are NOT used.
What it writes, apart and dated, to data-sources/cityctx/<date>/voxcity-<area>.json: the grid of land cover classes VoxCity makes (one character a cell, a row a string, the southern row first and the western cell
first), the class names, the cell size, the bounds, and the version of VoxCity. `pnpm cityctx` turns the grid into the area's water, green and wood outlines. A file that is already there is not made again.
"""
import json
import math
import os
import sys
import tempfile
from datetime import date
from importlib.metadata import version
from pathlib import Path

import numpy as np
from voxcity.generator.grids import get_land_cover_grid

# The downloads are kept between runs (VoxCity's own cache) in the temporary folder, not in the repository or the home folder.
os.environ.setdefault("VOXCITY_CACHE_DIR", str(Path(tempfile.gettempdir()) / "voxcity-cache"))
root = Path(__file__).resolve().parent.parent
config = json.loads((root / "scripts" / "cityctx.data.json").read_text())
day = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()
only = sys.argv[2] if len(sys.argv) > 2 else None
out = root / "data-sources" / "cityctx" / day
out.mkdir(parents=True, exist_ok=True)

# VoxCity's OpenStreetMap classes, 0-based, as it lists them.
CLASSES = ["Bareland", "Rangeland", "Shrub", "Moss and lichen", "Agriculture land", "Tree", "Wet land", "Mangroves", "Water", "Snow and ice", "Developed space", "Road", "Building", "No Data"]
CHARS = "0123456789abcd"

RAD = math.pi / 180.0
EARTH = 6371008.8
# What the drawing keeps of VoxCity's classes: water (Water, and Wet land, which is marsh and tidal flat), green (Rangeland: parks and lawns, Shrub, Moss, Agriculture land) and wood (Tree, Mangroves).
# Bareland, Developed space, Road and Building are not kept: the streets and the buildings come from their own layers, and the ground is the ground.
KEEP = {"water": [8, 6], "green": [1, 2, 3, 4], "wood": [5, 7]}


def outlines_of(doc, tolerance):
    """The outlines of the kept classes, as rings in metres east and north of the area's origin (holes are rings of their own: the drawing fills them even-odd)."""
    import rasterio.features
    from rasterio.transform import Affine
    from shapely.geometry import shape
    from shapely.geometry.polygon import orient

    rows = doc["rows"]
    h, w = len(rows), len(rows[0])
    grid = np.array([[int(c, 16) for c in row] for row in rows], dtype=np.uint8)
    west, south, east, north = doc["bounds"]
    lon0, lat0 = doc["origin"]
    k = math.cos(lat0 * RAD)
    # Row 0 is the southern row: flip it so that rasterio's north-up transform reads the grid the right way up.
    up = grid[::-1]
    dx, dy = (east - west) / w, (north - south) / h
    transform = Affine(dx, 0, west, 0, -dy, north)
    out = {}
    for name, classes in KEEP.items():
        mask = np.isin(up, classes).astype(np.uint8)
        rings = []
        for geometry, value in rasterio.features.shapes(mask, mask=mask.astype(bool), transform=transform, connectivity=4):
            poly = shape(geometry).simplify(tolerance, preserve_topology=True)
            if poly.is_empty:
                continue
            for part in getattr(poly, "geoms", [poly]):
                if part.area * (111320.0 * k) * 111320.0 < 4 * doc["meshsize"] ** 2:
                    continue
                part = orient(part)
                for ring in [part.exterior, *part.interiors]:
                    pts = [[round((lon - lon0) * RAD * EARTH * k, 1), round((lat - lat0) * RAD * EARTH, 1)] for lon, lat in ring.coords[:-1]]
                    if len(pts) >= 3:
                        rings.append(pts)
        out[name] = rings
    return out


for area in config["areas"]:
    if only is not None and area["id"] != only:
        continue
    file = out / f"voxcity-{area['id']}.json"
    if file.exists():
        doc = json.loads(file.read_text())
        if "outlines" not in doc:
            doc["outlines"] = outlines_of(doc, doc["meshsize"] * 0.35)
            doc["outlinesNote"] = "made from the grid by rasterio.features.shapes and shapely simplify (tolerance 0.35 cells), rings in metres east and north of origin, holes as rings of their own"
            file.write_text(json.dumps(doc, separators=(",", ":")) + "\n")
            print(area["id"], "outlines", {k: len(v) for k, v in doc["outlines"].items()})
        continue
    lon, lat = area["origin"]
    r = area["radius"]
    dlat = r / 111320.0
    dlon = r / (111320.0 * math.cos(math.radians(lat)))
    w, s, e, n = lon - dlon, lat - dlat, lon + dlon, lat + dlat
    mesh = 5.0 if area["kind"] == "detail" else 20.0

    def cover(box):
        west, south, east, north = box
        rect = [(west, south), (west, north), (east, north), (east, south)]
        return np.asarray(get_land_cover_grid(rect, mesh, "OpenStreetMap", tempfile.mkdtemp(prefix="voxcity-"), print_class_info=False, quiet=True, gridvis=False, use_download_cache=True))

    if area["kind"] == "detail":
        grid = cover((w, s, e, n))
    else:
        # A city is too much for one Overpass request: it is asked for in tiles of TILE metres a side (a whole number of cells), and the grids are put together, each cut or padded to the cells its tile holds.
        TILE = 2000.0
        cells = round(TILE / mesh)
        across = math.ceil(2 * r / TILE)
        tdlat, tdlon = TILE / 111320.0, TILE / (111320.0 * math.cos(math.radians(lat)))
        west0, south0 = lon - across * tdlon / 2, lat - across * tdlat / 2
        w, s, e, n = west0, south0, west0 + across * tdlon, south0 + across * tdlat
        grid = np.full((across * cells, across * cells), 10, dtype=np.uint8)
        empty = []
        for i in range(across):
            for j in range(across):
                try:
                    tile = cover((west0 + j * tdlon, south0 + i * tdlat, west0 + (j + 1) * tdlon, south0 + (i + 1) * tdlat))
                except KeyError:
                    # OpenStreetMap maps nothing in the tile: open water, or nothing. Settled below from the tiles beside it.
                    empty.append((i, j))
                    continue
                part = np.full((cells, cells), 10, dtype=np.uint8)
                hh, ww = min(cells, tile.shape[0]), min(cells, tile.shape[1])
                part[:hh, :ww] = tile[:hh, :ww]
                grid[i * cells:(i + 1) * cells, j * cells:(j + 1) * cells] = part
        for i, j in empty:
            # An empty tile is water when the cells of the tiles beside it along its edges are (more than nine in ten), else it is left as developed ground.
            edges = []
            if i > 0 and (i - 1, j) not in empty:
                edges.append(grid[i * cells - 1, j * cells:(j + 1) * cells])
            if i + 1 < across and (i + 1, j) not in empty:
                edges.append(grid[(i + 1) * cells, j * cells:(j + 1) * cells])
            if j > 0 and (i, j - 1) not in empty:
                edges.append(grid[i * cells:(i + 1) * cells, j * cells - 1])
            if j + 1 < across and (i, j + 1) not in empty:
                edges.append(grid[i * cells:(i + 1) * cells, (j + 1) * cells])
            sea = np.concatenate(edges) if edges else np.array([], dtype=np.uint8)
            if sea.size and float(np.mean(sea == 8)) > 0.9:
                grid[i * cells:(i + 1) * cells, j * cells:(j + 1) * cells] = 8
            print("empty tile", (i, j), "water" if sea.size and float(np.mean(sea == 8)) > 0.9 else "left as developed ground")
    rows = ["".join(CHARS[int(c)] for c in row) for row in grid]
    file.write_text(json.dumps({
        "read": day, "area": area["id"], "origin": area["origin"], "radius": r,
        "source": "VoxCity %s get_land_cover_grid(source='OpenStreetMap'), run locally; OpenStreetMap through Overpass" % version("voxcity"),
        "licence": "ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright (VoxCity itself is MIT)",
        "bounds": [w, s, e, n], "meshsize": mesh, "shape": list(grid.shape),
        "order": "row 0 is the southernmost row and column 0 the westernmost; rows are strings, one character a cell, the character is the hexadecimal index of the class",
        "classes": CLASSES, "rows": rows,
    }, separators=(",", ":")) + "\n")
    doc = json.loads(file.read_text())
    doc["outlines"] = outlines_of(doc, mesh * 0.35)
    doc["outlinesNote"] = "made from the grid by rasterio.features.shapes and shapely simplify (tolerance 0.35 cells), rings in metres east and north of origin, holes as rings of their own"
    file.write_text(json.dumps(doc, separators=(",", ":")) + "\n")
    print(area["id"], grid.shape, {CLASSES[int(k)]: int(v) for k, v in zip(*np.unique(grid, return_counts=True))})
