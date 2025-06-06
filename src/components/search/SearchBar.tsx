import { usePathname, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

export function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { course } = useParams();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");

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
    <div className="flex w-full">
      <Input
        className="rounded-l-lg rounded-r-none border-[0.5px] border-r-0"
        placeholder="Search for a course, CRN, or phrase"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <Button
        size="icon"
        className="bg-accent rounded-l-none rounded-r-lg"
        onClick={() => handleSubmit()}
      >
        <Search className="size-4" transform="scale(-1, 1)" />
      </Button>
    </div>
  );
}
