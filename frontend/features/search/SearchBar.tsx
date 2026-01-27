import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/joy/Autocomplete";
import { API_URL } from "../../config/api";
import { useHierarchy, addHierarchyToURL } from "../../contexts/HierarchyContext";
import { useSelection } from "../../contexts/SelectionContext";

function SearchBar() {
  const { hierarchyView } = useHierarchy();
  const { setSearchBarSelectedName, triggerSearch } = useSelection();
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setOptions([]);
        return;
      }
      setLoading(true);
      const url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}search_complete?input=${encodeURIComponent(inputValue)}`,
      );
      try {
        const response = await fetch(url);
        const data = await response.json();
        setOptions(data.slice(0, 100));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [inputValue, hierarchyView]);

  return (
    <Autocomplete
      options={options}
      loading={loading}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_, newValue) => {
        const selectedName = typeof newValue === "string" ? newValue : null;
        setValue(null);
        setInputValue("");
        if (selectedName) {
          setSearchBarSelectedName(selectedName);
          triggerSearch();
        }
      }}
      placeholder="Search..."
      size={"sm"}
      freeSolo
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => (typeof option === "string" ? option : "")}
    />
  );
}

// Memoize to prevent unnecessary re-renders when contexts change
export default React.memo(SearchBar);
