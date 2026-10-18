import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react';

export const ThemePreviewCard = ({ themePreset }) => {
  const { theme, setTheme, activeMode } = useTheme();
  const isSelected = theme === themePreset.id;

  return (
    <div
      onClick={() => setTheme(themePreset.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setTheme(themePreset.id);
      }}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-elevated'
          : 'border-border bg-surface hover:border-text-muted/40 hover:shadow-subtle'
      }`}
    >
      {/* Top Banner Mini Palette Representation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            <span
              className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: themePreset.primary }}
              title={`Primary: ${themePreset.primary}`}
            />
            <span
              className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: themePreset.accent }}
              title={`Accent: ${themePreset.accent}`}
            />
          </div>
          <span className="text-xs font-semibold text-text">{themePreset.name}</span>
        </div>

        {isSelected && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shadow-sm">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Mini Mockup Visual Preview */}
      <div className="rounded-lg p-2.5 border border-border/80 bg-background mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div
            className="w-16 h-2 rounded-full"
            style={{ backgroundColor: themePreset.primary }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: themePreset.accent }}
          />
        </div>
        <div className="w-full h-1.5 rounded-full bg-border" />
        <div className="w-3/4 h-1.5 rounded-full bg-border/60" />
        <div className="flex gap-1.5 pt-1">
          <div
            className="px-2 py-0.5 rounded text-[9px] font-medium text-white"
            style={{ backgroundColor: themePreset.primary }}
          >
            Button
          </div>
          <div
            className="px-2 py-0.5 rounded text-[9px] font-medium border"
            style={{ borderColor: themePreset.accent, color: themePreset.accent }}
          >
            Badge
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="font-medium text-text-muted">{themePreset.category}</span>
        <span className="italic truncate max-w-[140px]">{themePreset.mood}</span>
      </div>
    </div>
  );
};
