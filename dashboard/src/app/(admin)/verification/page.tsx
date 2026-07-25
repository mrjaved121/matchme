import { createClient } from "../../../lib/supabase/server";
import { VerificationTable, type VerificationRow } from "../../../components/VerificationTable";

export default async function VerificationPage() {
  const supabase = await createClient();

  const { data: pending, error } = await supabase
    .from("profiles")
    .select("id, first_name, verification_photo_path")
    .eq("verification_status", "pending")
    .order("updated_at", { ascending: true });

  const ids = (pending ?? []).map((p) => p.id);

  const { data: photos } = ids.length
    ? await supabase
        .from("profile_photos")
        .select("profile_id, storage_path")
        .in("profile_id", ids)
        .eq("position", 0)
    : { data: [] };

  const photoByProfile = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));

  const rows: VerificationRow[] = (pending ?? []).map((p) => {
    const profilePhotoPath = photoByProfile.get(p.id) ?? null;
    return {
      id: p.id,
      firstName: p.first_name,
      profilePhotoUrl: profilePhotoPath
        ? supabase.storage.from("profile-photos").getPublicUrl(profilePhotoPath).data.publicUrl
        : null,
      selfiePath: p.verification_photo_path,
    };
  });

  // Verification selfies live in a private bucket, so each needs its own
  // short-lived signed URL rather than the public-bucket getPublicUrl used
  // for ordinary profile photos.
  for (const row of rows) {
    if (!row.selfiePath) continue;
    const { data } = await supabase.storage
      .from("verification-photos")
      .createSignedUrl(row.selfiePath, 60 * 10);
    row.selfieUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Verification</h1>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <VerificationTable rows={rows} />
      )}
    </div>
  );
}
