// ফাইলের পাথ: app/(admin)/design/guide-templates/page.tsx
// [NEW] গাইড টেমপ্লেট ম্যানেজার — guide_page_templates টেবিলের CRUD UI। প্যাটার্ন
// app/(admin)/design/categories/page.tsx-এর সাথে মিলিয়ে লেখা (thin server page +ClientComponent)।

import { listGuideTemplates } from '@/app/actions/guideTemplates';
import GuideTemplatesPageClient from '@/components/design/GuideTemplatesPageClient';

export const dynamic = 'force-dynamic';

export default async function GuideTemplatesPage() {
  const templates = await listGuideTemplates();
  return (
    <div className="mx-auto max-w-3xl">
      <GuideTemplatesPageClient initialTemplates={templates} />
    </div>
  );
}
