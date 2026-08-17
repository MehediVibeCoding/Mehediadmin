import { getCategories } from '@/app/actions/categories';
import ParserPageClient from './ParserPageClient';

export const dynamic = 'force-dynamic';

export default async function ParserPage() {
  const categories = await getCategories();
  return <ParserPageClient categories={categories} />;
}
