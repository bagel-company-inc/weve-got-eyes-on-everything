import React, { useState, useEffect, useRef, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import Box from "@mui/joy/Box";

// Improved version of https://usehooks.com/useOnClickOutside/
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    let startedInside = false;
    let startedWhenMounted = false;

    const listener = (event) => {
      // Do nothing if `mousedown` or `touchstart` started inside ref element
      if (startedInside || !startedWhenMounted) return;
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) return;

      handler(event);
    };

    const validateEventStart = (event) => {
      startedWhenMounted = ref.current;
      startedInside = ref.current && ref.current.contains(event.target);
    };

    document.addEventListener("mousedown", validateEventStart);
    document.addEventListener("touchstart", validateEventStart);
    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("mousedown", validateEventStart);
      document.removeEventListener("touchstart", validateEventStart);
      document.removeEventListener("click", listener);
    };
  }, [ref, handler]);
};

const ColorfulPopup = ({ colour, onChange }) => {
  const popover = useRef();
  const [isOpen, toggle] = useState(false);

  const close = useCallback(() => toggle(false), []);
  useClickOutside(popover, close);

  return (
    <Box>
      <div
        className="swatch"
        style={{
          backgroundColor: colour,
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          border: "1px solid #363535ff",
        }}
        onClick={() => toggle(true)}
      />

      {isOpen && (
        <div className="popover" ref={popover}>
          <HexColorPicker color={colour} onChange={onChange} />
        </div>
      )}
    </Box>
  );
};

export default ColorfulPopup;
