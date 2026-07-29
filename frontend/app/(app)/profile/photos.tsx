import { useEffect, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

const MAX_PHOTOS = 6;

type Photo = { id: string; storage_path: string; position: number };

export default function ManagePhotos() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();

  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    load();
  }, [myId]);

  async function load() {
    const { data } = await supabase
      .from("profile_photos")
      .select("id, storage_path, position")
      .eq("profile_id", myId)
      .order("position", { ascending: true });
    setPhotos(data ?? []);
    queryClient.invalidateQueries({ queryKey: ["my-photos", myId] });
  }

  async function pickAndAdd() {
    if (!photos || photos.length >= MAX_PHOTOS) return;

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

    setBusy(true);
    setError(undefined);

    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "image/jpeg";
      const ext = mimeType.split("/")[1] ?? "jpg";
      const nextPosition = photos.length === 0 ? 0 : Math.max(...photos.map((p) => p.position)) + 1;
      const path = `${myId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, decodeBase64(asset.base64!), { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      const { error: rowError } = await supabase
        .from("profile_photos")
        .insert({ profile_id: myId, storage_path: path, position: nextPosition });
      if (rowError) throw rowError;

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove(photo: Photo) {
    if (!photos || photos.length <= 1) {
      Alert.alert("Keep at least one photo", "You need at least one photo on your profile.");
      return;
    }
    Alert.alert("Remove this photo?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removePhoto(photo) },
    ]);
  }

  async function removePhoto(photo: Photo) {
    setBusy(true);
    setError(undefined);

    const { error: deleteError } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (deleteError) {
      setError(deleteError.message);
      setBusy(false);
      return;
    }

    await supabase.storage.from("profile-photos").remove([photo.storage_path]);
    await load();
    setBusy(false);
  }

  async function move(index: number, direction: -1 | 1) {
    if (!photos) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    setBusy(true);
    setError(undefined);

    const a = photos[index];
    const b = photos[targetIndex];

    // Three-step swap avoids a transient unique(profile_id, position) clash,
    // since each UPDATE is checked immediately.
    const { error: e1 } = await supabase.from("profile_photos").update({ position: -1 }).eq("id", a.id);
    const { error: e2 } = e1
      ? { error: e1 }
      : await supabase.from("profile_photos").update({ position: a.position }).eq("id", b.id);
    const { error: e3 } = e1 || e2
      ? { error: e1 ?? e2 }
      : await supabase.from("profile_photos").update({ position: b.position }).eq("id", a.id);

    const swapError = e1 || e2 || e3;
    if (swapError) {
      setError(swapError.message);
    }

    await load();
    setBusy(false);
  }

  if (!photos) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text
        style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md }]}
      >
        Manage photos
      </Text>
      <Text
        style={[
          theme.typography.subtext,
          { color: theme.color.textSecondary, marginTop: 4, marginBottom: theme.spacing.md },
        ]}
      >
        Your first photo is your main profile photo. Use the arrows to reorder.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {photos.map((photo, index) => (
          <View key={photo.id} style={{ width: 96, gap: 6 }}>
            <Image
              source={{ uri: publicPhotoUrl(photo.storage_path) }}
              style={{ width: 96, height: 128, borderRadius: theme.radius.card }}
            />
            {index === 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  backgroundColor: theme.color.primary,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: theme.radius.pill,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>MAIN</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable disabled={busy || index === 0} onPress={() => move(index, -1)}>
                <Text style={{ color: index === 0 ? theme.color.border : theme.color.primary, fontSize: 16 }}>
                  ←
                </Text>
              </Pressable>
              <Pressable disabled={busy} onPress={() => confirmRemove(photo)}>
                <Text style={{ color: theme.color.error, fontSize: 16 }}>✕</Text>
              </Pressable>
              <Pressable disabled={busy || index === photos.length - 1} onPress={() => move(index, 1)}>
                <Text
                  style={{
                    color: index === photos.length - 1 ? theme.color.border : theme.color.primary,
                    fontSize: 16,
                  }}
                >
                  →
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={pickAndAdd}
            disabled={busy}
            style={{
              width: 96,
              height: 128,
              borderRadius: theme.radius.card,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: theme.color.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={[theme.typography.title, { color: theme.color.primary }]}>+</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: theme.spacing.md }]}>
          {error}
        </Text>
      ) : null}

      <Button label="Done" variant="secondary" onPress={() => router.back()} style={{ marginTop: theme.spacing.xl }} />
    </ScreenContainer>
  );
}
