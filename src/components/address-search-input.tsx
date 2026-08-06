"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function AddressSearchInput({
  onSelect,
  placeholder = "Buscar endereço...",
}: {
  onSelect: (result: { latitude: number; longitude: number; label: string }) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=5&q=${encodeURIComponent(query)}`,
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-8"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-sm shadow-md">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect({
                  latitude: Number(result.lat),
                  longitude: Number(result.lon),
                  label: result.display_name,
                });
                setQuery(result.display_name);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
