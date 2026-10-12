// R2 (Cloudflare) আপলোড হেল্পার — আগের Supabase Storage আপলোডের রিপ্লেসমেন্ট।
// R2 S3-compatible API ব্যবহার করে, তাই @aws-sdk/client-s3 দিয়েই কাজ হয়,
// আলাদা কোনো Cloudflare-নির্দিষ্ট SDK লাগে না।
//
// প্রয়োজনীয় env vars (Vercel Dashboard → Settings → Environment Variables):
//   R2_ACCOUNT_ID        — Cloudflare ড্যাশবোর্ডের ডান দিকে অ্যাকাউন্ট আইডি
//   R2_ACCESS_KEY_ID      — R2 API Token তৈরির সময় পাওয়া Access Key ID
//   R2_SECRET_ACCESS_KEY  — R2 API Token তৈরির সময় পাওয়া Secret Access Key
//   R2_BUCKET_NAME        — bucket-এর নাম (এখন: vangcur-img)
//   R2_PUBLIC_BASE_URL    — bucket-এ কানেক্ট করা কাস্টম ডোমেইন, যেমন https://img.vangcur.com

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 env vars সেট করা নেই (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export interface R2UploadResult {
  ok: boolean;
  url?: string;
  message?: string;
}

/**
 * ফাইল R2-তে আপলোড করে পাবলিক URL ফেরত দেয়।
 * prefix: path-এর ফোল্ডার অংশ (যেমন 'products', 'reviews', 'hero-cards', 'home-showcase')
 * — আগের Supabase Storage কাঠামোর সাথে মিল রেখে একই convention রাখা হলো।
 */
export async function uploadToR2(file: File, prefix: string, ext: string): Promise<R2UploadResult> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!bucket || !publicBase) {
    return { ok: false, message: 'R2 bucket/public URL env var সেট করা নেই' };
  }
  try {
    const client = getR2Client();
    const path = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const base = publicBase.endsWith('/') ? publicBase.slice(0, -1) : publicBase;
    return { ok: true, url: `${base}/${path}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'R2 আপলোড ব্যর্থ' };
  }
}
