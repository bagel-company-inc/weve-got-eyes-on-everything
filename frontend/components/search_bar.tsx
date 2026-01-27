import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/joy/Autocomplete";
import { API_URL } from "../api_url";
import { HierarchyView, addHierarchyToURL } from "./hierarchy";

interface SearchBarProps {
  onSelectionChange?: (name: string | null) => void;
  hierarchyView: HierarchyView | null;
}

export default function SearchBar({
  onSelectionChange,
  hierarchyView,
}: SearchBarProps) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        // Only fetch if input has at least 2 characters
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

    const debounceTimeout = setTimeout(fetchSuggestions, 300); // Debounce API calls
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
        setValue(null); // Clear the value immediately to allow re-selection
        setInputValue(""); // Clear the input as well
        if (onSelectionChange) {
          onSelectionChange(selectedName);
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
