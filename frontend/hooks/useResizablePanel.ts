import { useState, useCallback, useEffect } from "react";

interface ResizablePanelResult {
  width: number;
  isResizing: boolean;
  handleMouseDown: () => void;
}

/**
 * Hook to handle resizable panel logic
 * @param initialWidth - Initial width of the panel in pixels
 * @param minWidth - Minimum width in pixels (default: 380)
 * @param maxWidth - Maximum width in pixels (default: 600)
 * @returns Object with width, isResizing state, and handleMouseDown function
 */
export function useResizablePanel(
  initialWidth: number = 520,
  minWidth: number = 380,
  maxWidth: number = 600,
): ResizablePanelResult {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
    },
    [isResizing, minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    handleMouseDown,
  };
}
