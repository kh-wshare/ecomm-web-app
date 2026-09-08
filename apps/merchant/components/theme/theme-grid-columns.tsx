"use client";

import { Description, Label, ToggleButton, ToggleButtonGroup } from "@heroui/react";

const OPTIONS = [2, 3, 4, 6];

/** Miniature wireframe of the resulting product grid. */
function GridGlyph({ columns }: { columns: number }) {
  return (
    <span
      aria-hidden
      className="grid w-full gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }, (_, index) => (
        <span
          className="h-5 rounded-[3px] bg-current opacity-30"
          key={index}
        />
      ))}
    </span>
  );
}

export function ThemeGridColumns({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm font-medium">Product grid columns</Label>
        <span className="font-mono text-xs text-muted">
          {value} per row
        </span>
      </div>

      <ToggleButtonGroup
        aria-label="Product grid columns"
        fullWidth
        isDetached
        selectedKeys={new Set([String(value)])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const [next] = Array.from(keys);
          if (next) onChange(Number(next));
        }}
      >
        {OPTIONS.map((columns) => (
          <ToggleButton
            className="h-auto flex-col gap-1.5 rounded-xl px-2 py-2.5"
            id={String(columns)}
            key={columns}
          >
            <GridGlyph columns={columns} />
            <span className="text-xs font-semibold">{columns}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Description className="text-xs text-muted">
        How many products sit side by side on desktop. Mobile always uses two.
      </Description>
    </div>
  );
}
