"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

const LANGUAGES = [
    { code: "en", label: "English", available: true },
    { code: "km", label: "Khmer", available: false },
    { code: "th", label: "Thai", available: false },
    { code: "vi", label: "Vietnamese", available: false },
    { code: "zh", label: "Chinese", available: false },
];

export function LanguageContent() {
    const [selected, setSelected] = useState("en");

    return (
        <div className="flex flex-col gap-1 rounded-3xl border border-neutral-200 p-2 dark:border-neutral-700">
            {LANGUAGES.map((language) => {
                const isSelected = language.code === selected;

                return (
                    <button
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors enabled:hover:bg-neutral-50 disabled:opacity-40 dark:enabled:hover:bg-neutral-800/50"
                        disabled={!language.available}
                        key={language.code}
                        type="button"
                        onClick={() => setSelected(language.code)}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{language.label}</span>
                            {!language.available && (
                                <span className="block text-xs text-default-500">Coming soon</span>
                            )}
                        </span>
                        {isSelected && (
                            <Icon icon="solar:check-circle-bold" className="size-5 shrink-0 text-accent" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
