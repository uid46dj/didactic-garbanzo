import { useEffect, useState } from "react";
import { loadFaceModels } from "../lib/faceApi";

export function useFaceModels() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadFaceModels().then((ok) => {
      if (!mounted) return;
      setReady(ok);
      setFailed(!ok);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { ready, failed, loading };
}
