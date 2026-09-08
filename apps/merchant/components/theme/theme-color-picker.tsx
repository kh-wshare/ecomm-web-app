"use client";

import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
  parseColor,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";

type Color = ReturnType<typeof parseColor>;

const SWATCHES = [
  "#111827",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#f97316",
  "#a16207",
  "#16a34a",
  "#0d9488",
  "#0ea5e9",
  "#64748b",
  "#ffffff",
];

/** Stored values are hex strings; fall back to black when unparseable. */
function toColor(value: string): Color {
  try {
    return parseColor(value);
  } catch {
    return parseColor("#000000");
  }
}

export function ThemeColorPicker({
  description,
  label,
  onChange,
  value,
}: {
  description?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  // Hold the colour as a Color object instead of deriving it from the hex prop
  // on every render: hex cannot carry hue for pure black/white, so round
  // tripping through it would reset the hue slider mid-drag.
  const [color, setColor] = useState<Color>(() => toColor(value));
  const emitted = useRef(value);

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setColor(toColor(value));
  }, [value]);

  const handleChange = (next: Color) => {
    setColor(next);
    const hex = next.toString("hex");
    emitted.current = hex;
    onChange(hex);
  };

  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium capitalize">{label}</Label>

      <ColorPicker value={color} onChange={handleChange}>
        <ColorPicker.Trigger className="h-11 w-full justify-start rounded-xl border border-separator bg-background px-2.5 hover:bg-surface-secondary/60">
          <ColorSwatch className="size-7 shrink-0 rounded-lg" />
          <span className="flex-1 truncate text-left font-mono text-xs uppercase text-muted">
            {color.toString("hex")}
          </span>
        </ColorPicker.Trigger>

        <ColorPicker.Popover>
          <ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness">
            <ColorArea.Thumb />
          </ColorArea>

          <ColorSlider channel="hue" colorSpace="hsb">
            <ColorSlider.Track>
              <ColorSlider.Thumb />
            </ColorSlider.Track>
          </ColorSlider>

          <ColorField aria-label={`${label} hex value`}>
            <ColorField.Group>
              <ColorField.Input className="font-mono uppercase" />
            </ColorField.Group>
          </ColorField>

          <ColorSwatchPicker aria-label={`${label} presets`}>
            {SWATCHES.map((swatch) => (
              <ColorSwatchPicker.Item color={swatch} key={swatch}>
                <ColorSwatchPicker.Swatch />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
        </ColorPicker.Popover>
      </ColorPicker>

      {description && <span className="text-xs text-muted">{description}</span>}
    </div>
  );
}
