import SearchResults from "./searchResults";
import { SearchBar } from "./searchPanel";

export default async function Page() {
  return (
    <div className="grid grid-cols-2">
      <SearchBar />
      <SearchResults />
    </div>
  );
}
