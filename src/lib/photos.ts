import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

// Shared photo plumbing: a calm source chooser (camera or library) and the
// Convex storage upload. Used by the board, profile photo, and event covers.

async function fromCamera(): Promise<string[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return [];
  const shot = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  return shot.canceled ? [] : shot.assets.map((a) => a.uri);
}

async function fromLibrary(multiple: boolean): Promise<string[]> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.6,
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 6 : 1,
  });
  return picked.canceled ? [] : picked.assets.map((a) => a.uri);
}

// Ask where the photo comes from, then return local URIs ([] on cancel).
export function pickImages({ multiple = false } = {}): Promise<string[]> {
  return new Promise((resolve) => {
    Alert.alert("Add a photo", undefined, [
      { text: "Take photo", onPress: () => fromCamera().then(resolve) },
      {
        text: multiple ? "Choose from library" : "Choose photo",
        onPress: () => fromLibrary(multiple).then(resolve),
      },
      { text: "Cancel", style: "cancel", onPress: () => resolve([]) },
    ]);
  });
}

// Upload one local image to a Convex storage upload URL → storageId.
// Uses FileSystem.uploadAsync — RN's fetch(file://).blob() is unreliable for
// local files, which silently broke uploads on device.
export async function uploadImage(uri: string, uploadUrl: string): Promise<string> {
  const mime = uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const res = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "POST",
    headers: { "Content-Type": mime },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (res.status !== 200) throw new Error(`Upload failed (${res.status})`);
  const { storageId } = JSON.parse(res.body) as { storageId: string };
  return storageId;
}
