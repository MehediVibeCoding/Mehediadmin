# Admin Panel Patch — গাইড পেজ তৈরির ফ্লো সহজ করা

## ১. কোড পরিবর্তন (এই ফাইলটা আপলোড করুন)
`components/guides/GuidePagesListModal.tsx` — Mehediadmin রিপোতে ঠিক এই path-এ replace করুন।

**যা বদলেছে:** "+ টেমপ্লেট থেকে নতুন গাইড পেজ" ফর্মে আগে URL Slug + টাইটেল (বাংলা) +
টাইটেল (English) — তিনটাই টাইপ করা লাগত। এখন শুধু টেমপ্লেট বেছে নিয়ে "তৈরি করুন" চাপলেই
একটা ড্রাফট পেজ তৈরি হয়ে সরাসরি এডিটরের "📋 পেস্ট করে বসান" ট্যাব খুলে যায় — সেখানে
কনটেন্ট পেস্ট করে "পার্স করুন" চাপলে Slug/H1/Meta সব নিজে থেকে বসে যাবে।

কোনো ডাটাবেজ মাইগ্রেশন লাগবে না — শুধু এই একটা ফাইল বদলালেই চলবে।

## ২. বাকি ৩টা টেমপ্লেট — কোনো কোড লাগবে না, শুধু UI থেকে যোগ করুন

Admin panel → Design → গাইড টেমপ্লেট → "+ নতুন টেমপ্লেট" — এই ৩ বার পূরণ করুন:

| Key | নাম (বাংলা) | নাম (English) | Scope | URL Prefix |
|---|---|---|---|---|
| `pillar_guide` | Pillar / Hub গাইড | Pillar / Hub Guide | Product | *(খালি রাখুন)* |
| `comparison_guide` | Comparison গাইড | Comparison Guide | Product | *(খালি রাখুন)* |
| `design_ideas_guide` | Design Ideas গাইড | Design Ideas Guide | Product | `guides` |

("App/Remote Guide" আর "Installation Guide" — এই ২টা টেমপ্লেট আগে থেকেই আছে, ধরিনি।)

সবগুলোর **Scope = Product** — কোনো ক্যাটাগরি-বাঁধন নেই, তাই যেকোনো প্রোডাক্টের পেজ
থেকে এই ৫টার যেকোনোটা তৈরি করা যাবে। block_skeleton খালি রেখেই "তৈরি করুন" — যেহেতু
কনটেন্ট এখন paste করেই বসবে, আগে থেকে ব্লক সাজানোর দরকার নেই।
