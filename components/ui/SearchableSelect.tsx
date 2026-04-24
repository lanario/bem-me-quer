"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiChevronDown } from "react-icons/fi";

export type SearchableSelectOption = {
  id: number;
  label: string;
};

interface SearchableSelectProps {
  name: string;
  options: SearchableSelectOption[];
  value: number | "";
  onValueChange: (value: number | "") => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Campo de formulário com busca por texto e lista filtrada (combobox).
 * Envia o id selecionado via input hidden com o `name` informado.
 */
export function SearchableSelect({
  name,
  options,
  value,
  onValueChange,
  required,
  placeholder = "Buscar…",
  className = "",
  inputClassName = "",
  disabled,
}: SearchableSelectProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(
    () =>
      value === "" ? "" : (options.find((o) => o.id === value)?.label ?? ""),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return options;
    return options.filter((o) => normalizeSearch(o.label).includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
  }, [disabled]);

  const handleSelect = useCallback(
    (optionId: number) => {
      onValueChange(optionId);
      setOpen(false);
      setQuery("");
    },
    [onValueChange],
  );

  const displayText = open ? query : selectedLabel;

  const inputBase =
    "w-full rounded-lg border border-bmq-border bg-white pl-3 pr-10 py-2 text-sm text-bmq-dark placeholder:text-bmq-mid-dark focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="hidden"
        name={name}
        value={value === "" ? "" : String(value)}
        required={required}
      />
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayText}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (!open) setOpen(true);
            if (value !== "") onValueChange("");
          }}
          onFocus={openDropdown}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          className={`${inputBase} ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Fechar lista" : "Abrir lista"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              setOpen(false);
              setQuery("");
            } else {
              openDropdown();
            }
          }}
          className="absolute right-0 top-0 flex h-full items-center px-2 text-bmq-mid-dark hover:text-bmq-dark disabled:opacity-50"
        >
          <FiChevronDown
            size={18}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-bmq-border bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-bmq-mid-dark">
              Nenhum resultado
            </li>
          ) : (
            filtered.map((o) => (
              <li key={o.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === o.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(o.id)}
                  className="w-full px-3 py-2 text-left text-sm text-bmq-dark hover:bg-bmq-accent/15 focus:bg-bmq-accent/15 focus:outline-none"
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
