# এই zip সম্পর্কে

এটা Module ৫ (Traffic/Analytics)-এর **অসম্পূর্ণ** কাজ — যতটুকু build হয়েছে ততটুকু।

## যা করতে হবে আনজিপ করার পর

1. নিচের ফাইলগুলো `Mehediadmin/` ফোল্ডারের একই path বজায় রেখে ড্র্যাগ-ড্রপ করে
   repo-তে বসিয়ে দাও (existing ফাইল থাকলে overwrite করবে, এটাই দরকার):
   - `components/admin/Sidebar.tsx` (fix করা)
   - `components/dashboard/StatGrid.tsx` (fix + "আজকের ভিজিটর" কার্ড এখন `/traffic`-এ লিংক করে)
   - `components/customers/CustomersTable.tsx` (আগে ভুল জায়গায় ছিল, fix করা)
   - `app/actions/traffic.ts` (নতুন)
   - `lib/traffic.ts` (নতুন)
   - `components/traffic/TrafficStatCards.tsx` (নতুন)
   - `components/traffic/TrafficTrendChart.tsx` (নতুন)
   - `components/traffic/PeakHoursChart.tsx` (নতুন)

2. **গুরুত্বপূর্ণ — একটা ম্যানুয়াল ক্লিনআপ ধাপ:** repo-তে আগে থেকেই একটা bug
   ছিল, যেখানে `components/admin/Sidebar.tsx`, `components/dashboard/StatGrid.tsx`,
   `components/customers/CustomersTable.tsx`-এর সঠিক ভার্সনগুলো ভুলবশত
   `types/components/...` পাথের নিচে নেস্ট হয়ে গিয়েছিল। এই zip-এ সঠিক ফাইলগুলো
   সঠিক জায়গায় (`components/...`) দেওয়া আছে। **repo-তে বসানোর পর পুরো
   `types/components/` ফোল্ডারটা ম্যানুয়ালি ডিলিট করে দিও** (GitHub-এ zip
   drag-drop দিয়ে ফাইল ডিলিট করা যায় না, ওটা তোমাকে হাতে করতে হবে)।

3. এই zip-এ **এখনো নেই** এমন কিছু ফাইল লাগবে যেগুলো পরের চ্যাটে তৈরি হবে:
   - `components/traffic/TrafficDayTable.tsx`
   - `components/traffic/TopViewedProducts.tsx`
   - `app/(admin)/traffic/TrafficPageClient.tsx`
   - `app/(admin)/traffic/page.tsx`

   তাই **এই zip বসিয়ে এখনই build করলে এখনো fail করবে** (ওই ফাইলগুলোর
   অভাবে) — এটা প্রত্যাশিত, পরের চ্যাটের কাজ শেষ হলে ঠিক হয়ে যাবে।

## পরের চ্যাটে কী বলতে হবে

নিচের প্রম্পটটা কপি করে পরের Claude চ্যাটে paste করো (রিপো আবার clone করতে
বলা আছে, তাই এই zip আগে GitHub-এ বসিয়ে নিও, তারপর প্রম্পট দিও)।
