import { useState, useEffect } from "react";

// returns the current hash location (minus the '#' prefix)
const currentLocation = () => {
  return window.location.hash.replace(/^#/, "") || "/";
};

export const useHashLocation = () => {
  const [loc, setLoc] = useState(currentLocation());

  useEffect(() => {
    const handler = () => setLoc(currentLocation());

    // subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (to: string) => (window.location.hash = to);
  return [loc, navigate];
};
