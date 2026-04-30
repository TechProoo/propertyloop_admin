import { useEffect } from "react";

const SUFFIX = "PropertyLoop · Admin";

/**
 * Sets the document.title on mount and restores it on unmount.
 *
 * Usage:
 *   usePageTitle("Listings");
 *   // → "Listings · PropertyLoop · Admin"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
