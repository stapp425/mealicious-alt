import React, { useRef } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

type UseContainerQueryProps = {
  initialValue?: boolean;
  condition: (dimensions: { width: number; height: number; }) => boolean;
};

export function useContainerQuery<T extends HTMLElement = HTMLElement>({
  initialValue = false,
  condition
}: UseContainerQueryProps) {
  const ref = useRef<T>(null);
  const [matches, setMatches] = React.useState(initialValue);
  
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const resizeObserver = new ResizeObserver(([{ contentRect }]) => {
      setMatches(condition({
        width: contentRect.width,
        height: contentRect.height
      }));
    });
    
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [setMatches, condition]);

  return [ref, matches] as const;
}
