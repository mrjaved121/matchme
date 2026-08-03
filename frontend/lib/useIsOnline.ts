import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/** True/false once NetInfo reports, null while the first check is pending —
 * callers should treat null as "assume online" rather than flashing a
 * false-positive "No internet" state on cold start. */
export function useIsOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setOnline(state.isConnected ?? true);
    });
  }, []);

  return online;
}
