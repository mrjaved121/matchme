import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { publicPhotoUrl } from "../../lib/photoUrl";

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

type LocalPhoto = { uri: string; base64: string; mimeType: string };
type ExistingPhoto = { storage_path: string; position: number };
type Slot = { kind: "existing"; photo: ExistingPhoto } | { kind: "local"; photo: LocalPhoto };

// Matches design/stitch_just_spark_ui_kit/onboarding_photos/code.html: a
// fixed 2-column, 6-slot grid (not a wrapping row that only shows filled +
// one add tile) — "Primary" badge on the first photo, a remove button on
// every filled slot, dashed-border empty slots, and a photo-tips card.
// Requires 2 photos to continue, matching the export's copy exactly.
export default function OnboardingPhotos() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [existing, setExisting] = useState<ExistingPhoto[]>([]);
  const [local, setLocal] = useState<LocalPhoto[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const slots: Slot[] = [
    ...existing.map((photo) => ({ kind: "existing" as const, photo })),
    ...local.map((photo) => ({ kind: "local" as const, photo })),
  ];
  const totalCount = slots.length;
  const remainingSlots = MAX_PHOTOS - totalCount;
  const neededMore = Math.max(0, MIN_PHOTOS - totalCount);

  useEffect(() => {
    supabase
      .from("profile_photos")
      .select("storage_path, position")
      .eq("profile_id", session!.user.id)
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (data) setExisting(data);
      });
  }, [session]);

  async function pickImage() {
    if (remainingSlots <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to add photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0].base64) return;

    const asset = result.assets[0];
    setLocal((prev) => [...prev, { uri: asset.uri, base64: asset.base64!, mimeType: asset.mimeType ?? "image/jpeg" }]);
  }

  function removeLocal(uri: string) {
    setLocal((prev) => prev.filter((p) => p.uri !== uri));
  }

  async function removeExisting(storagePath: string) {
    setRemoving(storagePath);
    await supabase.storage.from("profile-photos").remove([storagePath]);
    await supabase.from("profile_photos").delete().eq("profile_id", session!.user.id).eq("storage_path", storagePath);
    setExisting((prev) => prev.filter((p) => p.storage_path !== storagePath));
    setRemoving(null);
  }

  async function handleNext() {
    if (totalCount < MIN_PHOTOS) {
      setError(`Add at least ${MIN_PHOTOS} photos.`);
      return;
    }
    setError(undefined);
    setLoading(true);

    try {
      const startPosition = existing.length === 0 ? 0 : Math.max(...existing.map((p) => p.position)) + 1;

      for (let i = 0; i < local.length; i++) {
        const photo = local[i];
        const ext = photo.mimeType.split("/")[1] ?? "jpg";
        const path = `${session!.user.id}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, decodeBase64(photo.base64), { contentType: photo.mimeType, upsert: true });

        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase
          .from("profile_photos")
          .insert({ profile_id: session!.user.id, storage_path: path, position: startPosition + i });

        if (rowError) throw rowError;
      }

      router.push("/onboarding/bio");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingStepLayout
      step={10}
      totalSteps={12}
      title="Add your photos"
      subtitle={`Add at least ${MIN_PHOTOS} photos to continue.`}
      onNext={handleNext}
      nextDisabled={loading || totalCount < MIN_PHOTOS}
      nextLoading={loading}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
            const slot = slots[i];
            const tileSize = "31.5%" as const;
            if (!slot) {
              return (
                <Pressable
                  key={`empty-${i}`}
                  onPress={pickImage}
                  style={{
                    width: tileSize,
                    aspectRatio: 3 / 4,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: theme.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.color.inputFill,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.color.surfaceSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={22} color={theme.color.primary} />
                  </View>
                </Pressable>
              );
            }

            const uri = slot.kind === "existing" ? publicPhotoUrl(slot.photo.storage_path) : slot.photo.uri;
            const key = slot.kind === "existing" ? slot.photo.storage_path : slot.photo.uri;
            const isBusy = slot.kind === "existing" && removing === slot.photo.storage_path;

            return (
              <View key={key} style={{ width: tileSize, aspectRatio: 3 / 4, borderRadius: 24, overflow: "hidden" }}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
                {i === 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Ionicons name="star" size={11} color={theme.color.primary} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.color.textPrimary }}>Primary</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => (slot.kind === "existing" ? removeExisting(slot.photo.storage_path) : removeLocal(slot.photo.uri))}
                  disabled={isBusy}
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isBusy ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="close" size={16} color={theme.color.textPrimary} />
                </Pressable>
              </View>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.surfaceSecondary,
            borderRadius: 16,
            padding: theme.spacing.md,
          }}
        >
          <Ionicons name="bulb-outline" size={20} color={theme.color.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>Photo tips</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 2 }]}>
              Ditch the sunglasses and group shots. Good lighting and a genuine smile get 3x more matches.
            </Text>
          </View>
        </View>

        {neededMore > 0 ? (
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>
            Need {neededMore} more photo{neededMore > 1 ? "s" : ""} to continue
          </Text>
        ) : null}
        {error ? <Text style={[theme.typography.caption, { color: theme.color.error, textAlign: "center" }]}>{error}</Text> : null}
      </View>
    </OnboardingStepLayout>
  );
}
