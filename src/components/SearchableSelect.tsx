"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  id: string;
  label: string;
  sub?: string | null;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "-- Select --",
  disabled = false,
  required = false,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.id === value);

  const filteredOptions = options.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sub && o.sub.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="label mb-1 block">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`input flex items-center justify-between text-left cursor-pointer ${
          disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white"
        }`}
      >
        <span className={`truncate ${!selectedOption ? "text-slate-400" : "text-slate-900 font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-[10px] text-slate-400 ml-2">▼</span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg bg-white p-2 shadow-xl ring-1 ring-black/10 border border-slate-200 space-y-2">
          <input
            type="text"
            className="input mt-0 text-xs py-1.5 px-2.5 w-full"
            placeholder="🔍 Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
            {placeholder && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-slate-400 hover:bg-slate-50 ${
                    !value ? "font-bold bg-slate-50" : ""
                  }`}
                >
                  {placeholder}
                </button>
              </li>
            )}

            {filteredOptions.length === 0 ? (
              <li className="p-2 text-slate-400 text-center">No options found</li>
            ) : (
              filteredOptions.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                      o.id === value
                        ? "bg-primary-50 text-primary-900 font-bold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <span>{o.label}</span>
                    {o.sub && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {o.sub}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
