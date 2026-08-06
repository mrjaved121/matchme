import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { SAVE_ERROR_MESSAGE } from "../../../lib/errorMessages";

type Status = "none" | "pending" | "approved" | "rejected";

const COPY: Record<Status, { title: string; body: string }> = {
  none: {
    title: "Get a verified badge",
    body: "Take a quick selfie. A real person on our team compares it to your profile photo — no AI, no third party.",
  },
  pending: {
    title: "Verification pending",
    body: "We've got your selfie — we'll review it shortly and let your profile show a verified badge once approved.",
  },
  approved: {
    title: "You're verified ✓",
    body: "Your profile shows a verified badge. Nice — that's one less thing your matches have to wonder about.",
  },
  rejected: {
    title: "Verification didn't go through",
    body: "Your selfie didn't clearly match your profile photo. Make sure your face is well-lit and unobstructed, then try again.",
  },
};

export default function Verification() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [status, setStatus] = useState<Status | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loadError, setLoadError] = useState(false);

  function loadStatus() {
    setLoadError(false);
    supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", myId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setLoadError(true);
          return;
        }
        setStatus((data?.verification_status as Status) ?? "none");
      });
  }

  useEffect(() => {
    loadStatus();
  }, [myId]);

  async function handleTakeSelfie() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera access is needed to verify your photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });

    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;

    setError(undefined);
    setUploading(true);

    const base64 = asset.base64;
    const ext = (asset.mimeType ?? "image/jpeg").split("/")[1] ?? "jpg";
    const path = `${myId}/selfie.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-photos")
      .upload(path, decodeBase64(base64), {
        contentType: asset.mimeType ?? "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_status: "pending", verification_photo_path: path })
      .eq("id", myId);

    setUploading(false);

    if (updateError) {
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    setStatus("pending");
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={loadStatus} />
      </ScreenContainer>
    );
  }

  if (!status) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  const copy = COPY[status];

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            {copy.title}
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
            {copy.body}
          </Text>
        </View>

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error, textAlign: "center" }]}>
            {error}
          </Text>
        ) : null}

        {status === "none" || status === "rejected" ? (
          <Button label="Take a selfie" onPress={handleTakeSelfie} loading={uploading} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}
