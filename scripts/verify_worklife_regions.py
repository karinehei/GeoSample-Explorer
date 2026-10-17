#!/usr/bin/env python3
"""Rebuild the regional occupational-disease assets from the pinned zip and compare them.

Exit 0 when the checksum matches and the derived files match the committed copies.
--write replaces the committed copies after a successful checksum.
A different size or SHA-256 stops before any write or comparison of contents.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "worklife"
COUNTS_PATH = OUT_DIR / "counts.json"
GEO_PATH = OUT_DIR / "regions.geojson"
LICENSE_PATH = OUT_DIR / "GEOMETRY-LICENSE.txt"
README_PATH = OUT_DIR / "GEOMETRY-README.md"

EXPECTED_BYTES = 292234
EXPECTED_SHA256 = "ad2261e1bcc95b68d852e96e7718b740ee5bbcb3a15c70d6e6d5fd80ece5713f"
SOURCE_URL = (
    "https://www.tyoelamatieto.fi/tellu-data/data/occupational-diseases/"
    "occupational-diseases-data-20052026.zip"
)
SOURCE_FILE = "data_2019_2023/data_C_2019_2023.tsv"
GEO_MEMBER = "finRegionsTopojson/finRegionsGeo.geojson"
LICENSE_MEMBER = "finRegionsTopojson/LICENSE.md"
README_MEMBER = "finRegionsTopojson/readme.md"
YEARS = [2019, 2020, 2021, 2022, 2023]
ALAND_CODE = 21
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def fail(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(code)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_zip(path: Path) -> bytes:
    if not path.is_file():
        fail(f"Zip not found: {path}")
    data = path.read_bytes()
    digest = sha256(data)
    if len(data) != EXPECTED_BYTES or digest != EXPECTED_SHA256:
        fail(
            "Pinned archive check failed. "
            f"Expected {EXPECTED_BYTES} bytes and {EXPECTED_SHA256}. "
            f"Got {len(data)} bytes and {digest}. Committed assets were left unchanged."
        )
    return data


def workbook_rows(xlsx: bytes) -> dict[int, dict[int, str]]:
    with zipfile.ZipFile(io.BytesIO(xlsx)) as package:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in package.namelist():
            root = ET.fromstring(package.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                shared.append("".join(node.text or "" for node in item.findall(".//m:t", NS)))
        sheet = ET.fromstring(package.read("xl/worksheets/sheet1.xml"))

    rows: dict[int, dict[int, str]] = {}
    for cell in sheet.findall(".//m:c", NS):
        ref = cell.attrib.get("r", "")
        column = 0
        row_number = 0
        for char in ref:
            if char.isalpha():
                column = column * 26 + (ord(char.upper()) - 64)
            elif char.isdigit():
                row_number = row_number * 10 + int(char)
        value_node = cell.find("m:v", NS)
        if cell.attrib.get("t") == "s" and value_node is not None and value_node.text is not None:
            value = shared[int(value_node.text)]
        elif value_node is not None and value_node.text is not None:
            value = value_node.text
        else:
            value = ""
        rows.setdefault(row_number, {})[column] = value
    return rows


def codebook_names(rows: dict[int, dict[int, str]]) -> dict[int, str]:
    names: dict[int, str] = {}
    started = False
    for row_number in sorted(rows):
        row = rows[row_number]
        heading = row.get(1, "")
        if heading.startswith("Maakunta / Region"):
            started = True
            continue
        if not started:
            continue
        code = heading
        label = row.get(2, "")
        if code.isdigit() and label:
            names[int(code)] = label
            continue
        if names:
            break
    if 21 in names:
        fail("Codebook contains region 21. Åland must stay outside the case codebook.")
    if 3 in names or 20 in names:
        fail("Codebook contains region 3 or 20, which this plan does not map.")
    expected = {1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19}
    if set(names) != expected:
        fail(f"Codebook region codes are {sorted(names)}, expected {sorted(expected)}.")
    if names[18] != "Kainuu (ml. Vaala)":
        fail(f"Code 18 label is {names[18]!r}, expected 'Kainuu (ml. Vaala)'.")
    return names


def count_cases(tsv: str) -> Counter[tuple[int, int]]:
    reader = csv.reader(io.StringIO(tsv), delimiter="\t")
    header = next(reader)
    if header != ["MAAKUNTAK", "VAHVVUOSI"]:
        fail(f"Unexpected file C header: {header}")
    counts: Counter[tuple[int, int]] = Counter()
    data_rows = 0
    for row in reader:
        if not any(cell.strip() for cell in row):
            continue
        if len(row) != 2:
            fail(f"File C row does not have two columns: {row}")
        code = int(row[0])
        year = int(row[1])
        if code == ALAND_CODE:
            fail("File C contains Åland (code 21). Refusing to mark those rows outside_scope.")
        counts[(code, year)] += 1
        data_rows += 1
    if data_rows != 6669:
        fail(f"File C has {data_rows} data rows, expected 6669.")
    return counts


def geometry_features(geo_bytes: bytes) -> list[dict]:
    geo = json.loads(geo_bytes.decode("utf-8"))
    if geo.get("type") != "FeatureCollection":
        fail("Region file is not a GeoJSON FeatureCollection.")
    crs = ((geo.get("crs") or {}).get("properties") or {}).get("name")
    if crs != "urn:ogc:def:crs:OGC:1.3:CRS84":
        fail(f"Unexpected geometry CRS: {crs}")
    features = geo.get("features") or []
    if len(features) != 19:
        fail(f"Geometry has {len(features)} features, expected 19.")
    return features


def build_counts(names: dict[int, str], cases: Counter[tuple[int, int]], features: list[dict]) -> dict:
    by_id = {}
    for feature in features:
        props = feature.get("properties") or {}
        if set(props) != {"ID", "REGIONNAME"}:
            fail(f"Unexpected geometry properties: {sorted(props)}")
        code = props["ID"]
        if not isinstance(code, int):
            fail(f"Geometry ID is not an integer: {code!r}")
        if code in by_id:
            fail(f"Duplicate geometry ID {code}.")
        by_id[code] = props["REGIONNAME"]

    if set(by_id) != set(names) | {ALAND_CODE}:
        fail(f"Geometry IDs {sorted(by_id)} do not match codebook codes plus {ALAND_CODE}.")
    if by_id[ALAND_CODE] != "Ahvenanmaa":
        fail(f"Geometry name for 21 is {by_id[ALAND_CODE]!r}, expected 'Ahvenanmaa'.")

    published_codes = []
    for code in sorted(names):
        if code not in by_id:
            fail(f"Code {code} has no geometry feature.")
        pair_counts = [cases[(code, year)] for year in YEARS]
        if any(count == 0 for count in pair_counts):
            fail(f"Code {code} has a zero pair. This archive has no explicit zero.")
        if any((code, year) not in cases for year in YEARS):
            # Eligible region with a missing year would be absent. This pinned
            # archive has every year, so a gap means the extract changed.
            fail(f"Code {code} is missing a year in the pinned extract.")
        published_codes.append(code)

    regions = []
    for code in published_codes:
        cells = {}
        for year in YEARS:
            cells[str(year)] = {"status": "published", "count": cases[(code, year)]}
        regions.append(
            {
                "code": code,
                "name": names[code],
                "nameSource": "codebook",
                "geometryName": by_id[code],
                "cells": cells,
            }
        )

    aland_cells = {str(year): {"status": "outside_scope", "count": None} for year in YEARS}
    regions.append(
        {
            "code": ALAND_CODE,
            "name": "Ahvenanmaa",
            "nameSource": "geometry",
            "geometryName": by_id[ALAND_CODE],
            "cells": aland_cells,
        }
    )

    published_total = sum(cases.values())
    if published_total != 6669:
        fail(f"Published total is {published_total}, expected 6669.")

    return {
        "provenance": {
            "sourceUrl": SOURCE_URL,
            "bytes": EXPECTED_BYTES,
            "sha256": EXPECTED_SHA256,
            "sourceFile": SOURCE_FILE,
            "dataRows": 6669,
            "verifiedOn": "2026-10-17",
            "dataLicense": "CC BY 4.0",
            "geometryLicense": "MIT",
            "geometryCopyright": ["Copyright (c) 2017 Lucify", "Copyright (c) 2018 FIOH"],
            "geometryFile": GEO_MEMBER,
        },
        "years": YEARS,
        "regions": regions,
    }


def dumps_counts(document: dict) -> str:
    return json.dumps(document, ensure_ascii=False, indent=2) + "\n"


def member(package: zipfile.ZipFile, name: str) -> bytes:
    try:
        return package.read(name)
    except KeyError:
        fail(f"Archive is missing {name}.")
        raise


def derive(zip_bytes: bytes) -> dict[Path, bytes]:
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as package:
        cases = count_cases(member(package, SOURCE_FILE).decode("utf-8-sig"))
        names = codebook_names(workbook_rows(member(package, "variables.xlsx")))
        geo_bytes = member(package, GEO_MEMBER)
        features = geometry_features(geo_bytes)
        document = build_counts(names, cases, features)
        return {
            COUNTS_PATH: dumps_counts(document).encode("utf-8"),
            GEO_PATH: geo_bytes,
            LICENSE_PATH: member(package, LICENSE_MEMBER),
            README_PATH: member(package, README_MEMBER),
        }


def compare(derived: dict[Path, bytes]) -> None:
    mismatches = []
    for path, content in derived.items():
        if not path.is_file():
            mismatches.append(f"missing {path.relative_to(ROOT)}")
            continue
        current = path.read_bytes()
        if current != content:
            mismatches.append(
                f"differs {path.relative_to(ROOT)} (committed {len(current)} bytes, rebuilt {len(content)} bytes)"
            )
    if mismatches:
        fail("Derived assets do not match the committed files:\n" + "\n".join(mismatches))
    print("Derived assets match the committed files.")


def write(derived: dict[Path, bytes]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for path, content in derived.items():
        path.write_bytes(content)
        print(f"Wrote {path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", required=True, type=Path, help="Path to the pinned zip")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Replace committed derivatives after the checksum succeeds",
    )
    args = parser.parse_args()
    derived = derive(read_zip(args.zip))
    if args.write:
        write(derived)
    compare(derived)


if __name__ == "__main__":
    main()
