#!/usr/bin/env python3
"""
Extract color variant PNGs from Qikink PSD mockup files.
Outputs to frontend/public/mockups/{SKU}/{color_name}.png
"""

import os
import sys
from pathlib import Path
from PIL import Image
import numpy as np

try:
    from psd_tools import PSDImage
except ImportError:
    print("Installing psd-tools...")
    os.system("pip install psd-tools pillow")
    from psd_tools import PSDImage

PRODUCTS_DIR = Path("/Users/macbookpro/caesura/Products")
OUTPUT_BASE = Path("/Users/macbookpro/caesura/frontend/public/mockups")
MAX_SIZE = 800  # max dimension in output PNG

# PSD configuration: each entry defines how to extract color variants
# type "colors_group": find a layer group named "Colors" (or similar), each child = one color
# type "direct": the color layers are direct children of the specified parent group
# "skip_layers": layer names to skip
# "front_group": optional parent group name to look inside

PSDS = [
    {
        "file": "Terry Oversized Tee.psd",
        "sku": "UT27",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Hoodie.psd",
        "sku": "UH24",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Heavyweight oversized Hooded Sweat shirt.psd",
        "sku": "UH32",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "SweatShirt.psd",
        "sku": "UH26",
        "type": "colors_group",
        "colors_group_name": "Color",
        "skip_layers": [],
    },
    {
        "file": "HeavyWeight Oversized Sweatshirt.psd",
        "sku": "UH35",
        "type": "direct_pixel",
        "parent_group_path": ["Front", "Group 1"],
        "skip_layers": [],
    },
    {
        "file": "Oversized Classic T-Shirt.psd",
        "sku": "UC22",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Oversized standard T Shirt.psd",
        "sku": "US22",
        "type": "direct_pixel",
        "parent_group_path": ["Front"],
        "skip_layers": ["Texture"],
    },
    {
        "file": "Boy's Crew Neck T-Shirt.psd",
        "sku": "BC01",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Men's Polo.psd",
        "sku": "MP25",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": ["Layer 1"],
    },
    {
        "file": "Men's Sleeveless T-Shirt.psd",
        "sku": "MS36",
        "type": "direct_pixel",
        "parent_group_path": ["Front "],
        "skip_layers": [],
    },
    {
        "file": "Unisex Oversized Shirts.psd",
        "sku": "UC28",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Unisex Terry Shorts.psd",
        "sku": "MT45",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Tank Top (1).psd",
        "sku": "FT37",
        "type": "direct_pixel",
        "parent_group_path": ["Front"],
        "skip_layers": ["Texture"],
    },
    {
        "file": "Varsity Jacket.psd",
        "sku": "UJ31",
        "type": "colors_group",
        "colors_group_name": "Color",
        "skip_layers": ["Layer 2"],
    },
    {
        "file": "Crop Hoodies.psd",
        "sku": "FC32",
        "type": "colors_group",
        "colors_group_name": "Colors",
        "skip_layers": [],
    },
    {
        "file": "Womens Crop Top new.psd",
        "sku": "FC39",
        "type": "single_template",
        "output_name": "white",
    },
    # HeavyWeight Oversized Sweatshirt (1).psd is a duplicate — skip
]


def normalize_color_name(name):
    """Convert layer name to filesystem-safe color key."""
    name = name.strip().lower()
    name = name.replace(" ", "_").replace("/", "_").replace("\\", "_")
    name = name.replace("(", "").replace(")", "").replace("'", "")
    return name


def find_group_by_name(layers, name, case_insensitive=True):
    """Recursively find a layer group by name."""
    for layer in layers:
        lname = layer.name.strip()
        match = lname.lower() == name.lower() if case_insensitive else lname == name
        if match and layer.is_group():
            return layer
    return None


def set_visibility(layer, visible):
    """Set layer visibility using psd-tools internals."""
    try:
        layer._record.flags.visible = visible
    except (AttributeError, TypeError):
        pass


def set_all_children_visibility(group, visible):
    """Set all direct children of a group to visible/invisible."""
    for child in group:
        set_visibility(child, visible)


def compose_and_save(psd, output_path, max_size=MAX_SIZE):
    """Composite PSD, flatten, resize, save as PNG with white background."""
    try:
        img = psd.composite(ignore_preview=True)
    except Exception as e:
        print(f"    composite() failed: {e}, trying topil()")
        try:
            img = psd.topil()
        except Exception as e2:
            print(f"    topil() also failed: {e2}")
            return False

    if img is None:
        print(f"    compose() returned None")
        return False

    # Convert to RGBA
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    # Flatten onto white background
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    img = bg.convert("RGB")

    # Resize to max_size (preserving aspect ratio)
    w, h = img.size
    if w > max_size or h > max_size:
        scale = max_size / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG", optimize=True)
    print(f"    Saved: {output_path.relative_to(OUTPUT_BASE.parent.parent.parent)}")
    return True


def extract_colors_group(psd, config):
    """Extract variants from a 'Colors' group where each child = one color."""
    group_name = config.get("colors_group_name", "Colors")
    skip = config.get("skip_layers", [])
    sku = config["sku"]

    # Find Colors group (may be nested)
    colors_group = None
    for layer in psd:
        if layer.is_group() and layer.name.strip().lower() == group_name.lower():
            colors_group = layer
            break
        # One level deep search
        if layer.is_group():
            for child in layer:
                if child.is_group() and child.name.strip().lower() == group_name.lower():
                    colors_group = child
                    break
            if colors_group:
                break

    if not colors_group:
        print(f"  ERROR: Could not find group '{group_name}'")
        return []

    # Get all color layer names (skip specified ones)
    color_layers = [
        c for c in colors_group
        if c.name.strip() not in skip
    ]

    if not color_layers:
        print(f"  ERROR: No color layers found in '{group_name}'")
        return []

    print(f"  Found {len(color_layers)} colors in '{group_name}' group")
    results = []

    for i, target_layer in enumerate(color_layers):
        color_name = target_layer.name.strip()
        print(f"  [{i+1}/{len(color_layers)}] Extracting: {color_name}")

        # Hide all, show only target
        for layer in colors_group:
            set_visibility(layer, False)
        set_visibility(target_layer, True)

        out_name = normalize_color_name(color_name) + ".png"
        out_path = OUTPUT_BASE / sku / out_name

        success = compose_and_save(psd, out_path)
        if success:
            results.append({"color": color_name, "file": f"/mockups/{sku}/{out_name}"})

    # Restore all visible
    for layer in colors_group:
        set_visibility(layer, True)

    return results


def find_group_by_path(psd, path):
    """Navigate to a nested group by path list."""
    current = psd
    for name in path:
        found = None
        for layer in current:
            if layer.name.strip() == name.strip() and layer.is_group():
                found = layer
                break
        if not found:
            # Try case-insensitive
            for layer in current:
                if layer.name.strip().lower() == name.strip().lower() and layer.is_group():
                    found = layer
                    break
        if not found:
            return None
        current = found
    return current


def extract_direct_pixel(psd, config):
    """Extract variants where color layers are pixel (non-group) layers inside a nested group path."""
    path = config.get("parent_group_path", [])
    skip = config.get("skip_layers", [])
    sku = config["sku"]

    container = find_group_by_path(psd, path) if path else psd
    if container is None:
        print(f"  ERROR: Could not navigate to path {path}")
        return []

    # Get all non-group, non-skipped layers
    color_layers = [c for c in container if c.name.strip() not in skip]
    if not color_layers:
        print(f"  ERROR: No pixel layers found at path {path}")
        return []

    print(f"  Found {len(color_layers)} color layers at {path}")
    results = []

    def set_vis(layer, visible):
        try:
            layer._record.flags.visible = visible
        except AttributeError:
            pass

    for i, target_layer in enumerate(color_layers):
        color_name = target_layer.name.strip()
        print(f"  [{i+1}/{len(color_layers)}] Extracting: {color_name}")

        # Hide all siblings, show target
        for layer in container:
            set_vis(layer, False)
        set_vis(target_layer, True)

        out_name = normalize_color_name(color_name) + ".png"
        out_path = OUTPUT_BASE / sku / out_name

        success = compose_and_save(psd, out_path)
        if success:
            results.append({"color": color_name, "file": f"/mockups/{sku}/{out_name}"})

    # Restore all visible
    for layer in container:
        set_vis(layer, True)

    return results


def extract_single_template(psd, config):
    """Export the entire PSD as a single template PNG."""
    sku = config["sku"]
    out_name = config.get("output_name", "white") + ".png"
    out_path = OUTPUT_BASE / sku / out_name
    print(f"  Exporting single template as {out_name}")
    success = compose_and_save(psd, out_path)
    if success:
        return [{"color": config.get("output_name", "white"), "file": f"/mockups/{sku}/{out_name}"}]
    return []


def extract_direct(psd, config):
    """Extract variants where color layers are direct children of a parent group (or top-level)."""
    parent_name = config.get("parent_group")
    skip = config.get("skip_layers", [])
    sku = config["sku"]

    if parent_name:
        parent = find_group_by_name(psd, parent_name)
        if not parent:
            print(f"  ERROR: Could not find group '{parent_name}'")
            return []
        color_layers = [c for c in parent if c.name.strip() not in skip and c.is_group()]
        container = parent
    else:
        # Top-level color groups (skip non-group layers)
        color_layers = [c for c in psd if c.is_group() and c.name.strip() not in skip]
        container = psd

    if not color_layers:
        print(f"  ERROR: No color layers found")
        return []

    print(f"  Found {len(color_layers)} color layers")
    results = []

    for i, target_layer in enumerate(color_layers):
        color_name = target_layer.name.strip()
        print(f"  [{i+1}/{len(color_layers)}] Extracting: {color_name}")

        # Hide all siblings, show target
        for layer in container:
            if layer.is_group():
                set_visibility(layer, False)
        set_visibility(target_layer, True)

        out_name = normalize_color_name(color_name) + ".png"
        out_path = OUTPUT_BASE / sku / out_name

        success = compose_and_save(psd, out_path)
        if success:
            results.append({"color": color_name, "file": f"/mockups/{sku}/{out_name}"})

    # Restore
    for layer in container:
        if layer.is_group():
            set_visibility(layer, True)

    return results


def main():
    all_results = {}

    for config in PSDS:
        psd_path = PRODUCTS_DIR / config["file"]
        sku = config["sku"]

        if not psd_path.exists():
            print(f"\nSKIP (not found): {config['file']}")
            continue

        print(f"\n{'='*60}")
        print(f"Processing: {config['file']} (SKU: {sku})")
        print(f"{'='*60}")

        try:
            psd = PSDImage.open(str(psd_path))
        except Exception as e:
            print(f"  ERROR opening PSD: {e}")
            continue

        extract_type = config.get("type", "colors_group")

        if extract_type == "colors_group":
            results = extract_colors_group(psd, config)
        elif extract_type == "direct":
            results = extract_direct(psd, config)
        elif extract_type == "direct_pixel":
            results = extract_direct_pixel(psd, config)
        elif extract_type == "single_template":
            results = extract_single_template(psd, config)
        else:
            print(f"  Unknown type: {extract_type}")
            continue

        all_results[sku] = results
        print(f"  Done: {len(results)} colors extracted")

    # Print summary
    print(f"\n{'='*60}")
    print("EXTRACTION SUMMARY")
    print(f"{'='*60}")
    total = 0
    for sku, results in all_results.items():
        print(f"{sku}: {len(results)} colors")
        for r in results:
            print(f"  {r['color']} -> {r['file']}")
        total += len(results)
    print(f"\nTotal: {total} PNG files extracted")

    # Write JS mapping for easy integration
    js_lines = ["// Auto-generated by extract_mockups.py", "// PSD mockup color mappings", "const PSD_MOCKUPS = {"]
    for sku, results in all_results.items():
        js_lines.append(f"  '{sku}': {{")
        for r in results:
            key = normalize_color_name(r["color"])
            fpath = r["file"]
            js_lines.append(f"    '{key}': '{fpath}',")
        js_lines.append("  },")
    js_lines.append("};")
    js_lines.append("module.exports = PSD_MOCKUPS;")

    mapping_path = OUTPUT_BASE.parent.parent / "src" / "psd_mockup_map.js"
    mapping_path.parent.mkdir(parents=True, exist_ok=True)
    with open(mapping_path, "w") as f:
        f.write("\n".join(js_lines))
    print(f"\nMapping written to: {mapping_path}")


if __name__ == "__main__":
    main()
