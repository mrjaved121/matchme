import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const MAX_PHOTOS = 6;

type LocalPhoto = { uri: string; base64: string; mimeType: string };

export default function OnboardingPhotos() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function pickImage() {
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
    setPhotos((prev) =>
      [...prev, { uri: asset.uri, base64: asset.base64!, mimeType: asset.mimeType ?? "image/jpeg" }].slice(
        0,
        MAX_PHOTOS,
      ),
    );
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleNext() {
    if (photos.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    setError(undefined);
    setLoading(true);

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const ext = photo.mimeType.split("/")[1] ?? "jpg";
        const path = `${session!.user.id}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, decodeBase64(photo.base64), { contentType: photo.mimeType, upsert: true });

        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase
          .from("profile_photos")
          .insert({ profile_id: session!.user.id, storage_path: path, position: i });

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
      step={5}
      totalSteps={7}
      title="Add your photos"
      subtitle={`Add 1-${MAX_PHOTOS} photos. Your first photo is your main profile photo.`}
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {photos.map((photo, index) => (
          <Pressable key={photo.uri} onPress={() => removePhoto(index)}>
            <Image
              source={{ uri: photo.uri }}
              style={{ width: 96, height: 128, borderRadius: theme.radius.card }}
            />
          </Pressable>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={pickImage}
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
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>
          {error}
        </Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
