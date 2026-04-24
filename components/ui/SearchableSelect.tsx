"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

const LIST_MAX_PX = 240;

interface ListBoxRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/**
 * Campo de formulário com busca por texto e lista filtrada (combobox).
 * Envia o id selecionado via input hidden com o `name` informado.
 * A lista é renderizada em portal (fixed) para não ser cortada por overflow em modais/tabelas.
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
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [listBox, setListBox] = useState<ListBoxRect | null>(null);

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
    setMounted(true);
  }, []);

  const updateListPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const margin = 8;
    const spaceBelow = vh - r.bottom - margin;
    const maxHeight = Math.min(LIST_MAX_PX, Math.max(80, spaceBelow));
    setListBox({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
      maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setListBox(null);
      return;
    }
    updateListPosition();
    const onScrollOrResize = () => updateListPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    const el = anchorRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateListPosition);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      ro?.disconnect();
    };
  }, [open, updateListPosition]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
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

  const listContent =
    mounted && open && listBox ? (
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        style={{
          position: "fixed",
          top: listBox.top,
          left: listBox.left,
          width: listBox.width,
          maxHeight: listBox.maxHeight,
          zIndex: 9999,
        }}
        className="overflow-y-auto overflow-x-hidden rounded-lg border border-bmq-border bg-white py-1 shadow-lg"
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
    ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="hidden"
        name={name}
        value={value === "" ? "" : String(value)}
        required={required}
      />
      <div ref={anchorRef} className="relative">
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
            className={
              open ? "rotate-180 transition-transform" : "transition-transform"
            }
          />
        </button>
      </div>
      {listContent != null
        ? createPortal(listContent, document.body)
        : null}
    </div>
  );
}
