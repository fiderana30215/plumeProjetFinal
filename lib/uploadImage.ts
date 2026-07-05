import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic']

/**
 * Déduit l'extension de fichier à partir du mimeType renvoyé par le picker
 * (fiable sur toutes les plateformes) plutôt que de parser l'URI, qui est
 * un blob: URL sans extension sur le web.
 */
export function resolveExtension(uri: string, mimeType?: string | null): string {
  const mimeExt = mimeType?.split('/').pop()?.toLowerCase()
  const looksLikeFilePath = !uri.startsWith('blob:') && !uri.startsWith('data:')
  const uriExt = looksLikeFilePath ? uri.split('.').pop()?.toLowerCase() : undefined
  const rawExt = mimeExt || uriExt || 'jpg'
  return ALLOWED_EXTENSIONS.includes(rawExt) ? (rawExt === 'jpeg' ? 'jpg' : rawExt) : 'jpg'
}

/**
 * Upload une image locale (avatar, couverture...) vers Supabase Storage.
 *
 * IMPORTANT : sur natif (iOS/Android), `fetch(uri).then(r => r.blob())`
 * suivi d'un upload échoue souvent avec "Network request failed" — c'est
 * un problème connu de React Native avec les gros payloads binaires via
 * fetch/blob. On lit donc le fichier en base64 via expo-file-system et on
 * l'envoie en ArrayBuffer, qui est la méthode fiable recommandée par
 * Supabase pour React Native. Sur web, fetch/blob reste utilisé (fiable
 * dans un navigateur, et FileSystem.readAsStringAsync ne marche pas avec
 * les URI blob: du web).
 */
export async function uploadImageToStorage(params: {
  bucket: string
  path: string
  uri: string
  mimeType?: string | null
  maxSizeBytes?: number
}): Promise<{ error: string | null, tooLarge?: boolean }> {
  const { bucket, path, uri, mimeType, maxSizeBytes } = params
  const contentType = mimeType || 'image/jpeg'

  try {
    if (Platform.OS === 'web') {
      const response = await fetch(uri)
      const blob = await response.blob()
      if (maxSizeBytes && blob.size > maxSizeBytes) return { error: null, tooLarge: true }

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType, upsert: true })
      return { error: error?.message ?? null }
    }

    if (maxSizeBytes) {
      const info = await FileSystem.getInfoAsync(uri)
      if (info.exists && info.size && info.size > maxSizeBytes) return { error: null, tooLarge: true }
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    const arrayBuffer = decode(base64)

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType, upsert: true })
    return { error: error?.message ?? null }
  } catch (e: any) {
    return { error: e?.message ?? 'Upload failed' }
  }
}