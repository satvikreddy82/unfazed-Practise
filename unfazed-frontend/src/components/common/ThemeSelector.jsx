import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';

export const ThemeSelector = ({ compact = false, showModeToggle = true }) => {
  const { theme, setTheme, mode, setMode, activeMode, themesList } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themesList.find((t) => t.id === theme) || themesList[0];

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      {/* Quick Theme Picker Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change color theme"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text text-xs font-medium shadow-subtle transition-all"
        id="theme-quick-picker-btn"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-sm"
          style={{ backgroundColor: currentTheme.primary }}
        />
        {!compact && <span className="hidden sm:inline font-medium">{currentTheme.name}</span>}
        <Palette className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {/* Mode Toggle (Light / Dark / System) */}
      {showModeToggle && (
        <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 shadow-subtle">
          <button
            type="button"
            onClick={() => setMode('light')}
            aria-label="Light mode"
            title="Light mode"
            className={`p-1.5 rounded-md transition-colors ${
              mode === 'light'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface-elevated'
            }`}
            id="mode-light-btn"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMode('dark')}
            aria-label="Dark mode"
            title="Dark mode"
            className={`p-1.5 rounded-md transition-colors ${
              mode === 'dark'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface-elevated'
            }`}
            id="mode-dark-btn"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMode('system')}
            aria-label="Follow system theme"
            title="Follow system theme"
            className={`p-1.5 rounded-md transition-colors ${
              mode === 'system'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface-elevated'
            }`}
            id="mode-system-btn"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown Menu for Theme Swatches */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-surface border border-border rounded-xl shadow-card z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs font-semibold text-text uppercase tracking-wider">Practice Theme</p>
            <p className="text-[11px] text-text-muted">Changes the complete visual palette</p>
          </div>

          <div className="space-y-1">
            {themesList.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-surface-elevated text-text font-semibold ring-1 ring-border'
                      : 'hover:bg-surface-elevated/60 text-text-muted hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Multi-color dual swatch */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 z-10 shadow-sm"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-text">{t.name}</div>
                      <div className="text-[10px] text-text-muted line-clamp-1">{t.mood}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
