import { usePathname, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { SearchIcon } from "lucide-react";

export function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { course } = useParams();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(searchParams);
      if (!query.trim()) {
        params.delete("q");
        window.history.replaceState(
          null,
          "",
          `${pathname}?${params.toString()}`,
        );
        return;
      }

      params.set("q", query);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    if (!course) {
      if (!query.trim()) {
        document.title = `SearchNEU`;
      } else {
        document.title = `${query} | SearchNEU`;
      }
    }

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit() {
    const params = new URLSearchParams(searchParams);
    if (!query.trim()) {
      params.delete("q");
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.set("q", query);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative w-full">
      <SearchIcon
        color="red"
        className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 -scale-x-100 transform"
      />
      <Input
        ref={searchInputRef}
        className="bg-background pl-10"
        placeholder="Search by course, professor, or phrase..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <span className="absolute top-2 right-2 bottom-2 flex items-center rounded-full bg-gray-100 px-3 text-xs font-medium text-gray-600">
        type / to search
      </span>
    </div>
  );
}
