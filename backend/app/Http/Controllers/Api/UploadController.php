<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * POST /merchant/upload/presign
     * Generate presigned URL untuk upload langsung ke Cloudflare R2 dari browser.
     * Tidak ada file yang melewati server Laravel — hemat bandwidth & lebih cepat.
     */
    public function presign(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $request->validate([
            'filename'  => 'required|string|max:255',
            'mime_type' => 'required|string|in:image/jpeg,image/png,image/webp,image/gif,video/mp4',
            'folder'    => 'nullable|string|in:products,banners,logos,labels',
        ]);

        $ext      = pathinfo($request->filename, PATHINFO_EXTENSION);
        $key      = sprintf(
            '%s/%s/%s.%s',
            $request->input('folder', 'products'),
            $store->slug,
            Str::uuid(),
            strtolower($ext)
        );

        // Buat presigned URL menggunakan AWS SDK (Cloudflare R2 kompatibel dengan S3 API)
        $s3Client = new \Aws\S3\S3Client([
            'version'     => 'latest',
            'region'      => 'auto',
            'endpoint'    => config('filesystems.disks.r2.endpoint'),
            'credentials' => [
                'key'    => config('filesystems.disks.r2.key'),
                'secret' => config('filesystems.disks.r2.secret'),
            ],
        ]);

        $cmd = $s3Client->getCommand('PutObject', [
            'Bucket'      => config('filesystems.disks.r2.bucket'),
            'Key'         => $key,
            'ContentType' => $request->mime_type,
            'ACL'         => 'public-read',
        ]);

        $presignedRequest = $s3Client->createPresignedRequest($cmd, '+15 minutes');
        $presignedUrl     = (string) $presignedRequest->getUri();
        $publicUrl        = config('filesystems.disks.r2.url') . '/' . $key;

        return response()->json([
            'upload_url' => $presignedUrl,
            'public_url' => $publicUrl,
            'key'        => $key,
            'expires_in' => 900, // 15 menit
        ]);
    }

    /**
     * POST /merchant/upload/presign-bg-removal
     * Buat presigned URL untuk upload gambar yang akan diproses AI background removal.
     */
    public function presignBgRemoval(Request $request): JsonResponse
    {
        // Sama dengan presign, tapi folder 'temp' dan trigger job background removal
        $request->validate([
            'filename'  => 'required|string|max:255',
            'mime_type' => 'required|string|in:image/jpeg,image/png,image/webp',
        ]);

        // Return presigned URL ke temp folder
        // Frontend upload ke sana, lalu call /ai/remove-background dengan key ini
        $key = 'temp/' . Str::uuid() . '.' . pathinfo($request->filename, PATHINFO_EXTENSION);

        return response()->json([
            'upload_url' => 'https://r2-upload-placeholder.alurelab.shop/' . $key,
            'temp_key'   => $key,
            'expires_in' => 300,
        ]);
    }

    /**
     * POST /merchant/upload
     * Upload langsung file/gambar ke local public storage tanpa AWS S3/R2.
     * Mendukung single file ('file') atau multi-file ('files[]').
     */
    public function directUpload(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $storeSlug = $store ? $store->slug : 'common';
        $folder = $request->input('folder', 'products');
        if (!in_array($folder, ['products', 'banners', 'pages', 'general', 'branding'])) {
            $folder = 'products';
        }

        $request->validate([
            'file'    => 'nullable|file|mimes:jpeg,png,jpg,webp,gif|max:8192',
            'files'   => 'nullable|array',
            'files.*' => 'file|mimes:jpeg,png,jpg,webp,gif|max:8192',
        ]);

        $uploadedUrls = [];
        $uploadedDetails = [];

        // Handle single file
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $filename = Str::uuid() . '.' . $ext;
            $subPath = "uploads/{$storeSlug}/{$folder}";
            $storedPath = $file->storeAs($subPath, $filename, 'public');

            $url = asset('storage/' . $storedPath);
            return response()->json([
                'success'  => true,
                'url'      => $url,
                'filename' => $file->getClientOriginalName(),
                'path'     => $storedPath,
                'size'     => $file->getSize(),
            ]);
        }

        // Handle multiple files
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
                $filename = Str::uuid() . '.' . $ext;
                $subPath = "uploads/{$storeSlug}/{$folder}";
                $storedPath = $file->storeAs($subPath, $filename, 'public');
                $url = asset('storage/' . $storedPath);

                $uploadedUrls[] = $url;
                $uploadedDetails[] = [
                    'url'      => $url,
                    'filename' => $file->getClientOriginalName(),
                    'path'     => $storedPath,
                ];
            }

            return response()->json([
                'success' => true,
                'url'     => $uploadedUrls[0] ?? null,
                'urls'    => $uploadedUrls,
                'files'   => $uploadedDetails,
            ]);
        }

        return response()->json([
            'message' => 'Tidak ada file yang diunggah.',
        ], 422);
    }
}

