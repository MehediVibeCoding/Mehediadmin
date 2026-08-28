'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import type { ProductQuestion, ProductQuestionAnswer, ProductQuestionWithAnswers } from '@/types';

const Q_TABLE = 'product_questions';
const A_TABLE = 'product_question_answers';
const PRODUCTS_TABLE = 'custom_products';
const PATH = '/reviews-qa';

// প্রশ্নের উত্তর admin দিলে এই নামেই সেভ হবে (spec অনুযায়ী)
const ADMIN_AUTHOR_NAME = 'Vangcur টিম';

export async function listProductQuestions(): Promise<ProductQuestionWithAnswers[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const [{ data: questions, error: qErr }, { data: answers, error: aErr }] = await Promise.all([
    supabase.from(Q_TABLE).select('*').order('created_at', { ascending: false }),
    supabase.from(A_TABLE).select('*').order('created_at', { ascending: true }),
  ]);
  if (qErr || !questions) return [];

  const rows = questions as ProductQuestion[];

  // product_questions টেবিলে প্রোডাক্টের নাম নেই, শুধু id — custom_products
  // থেকে জয়েন করে অ্যাডমিন UI-তে দেখানোর জন্য নাম বসানো হচ্ছে
  const productIds = Array.from(new Set(rows.map((q) => q.product_id).filter((id) => id != null)));
  const nameMap = new Map<number, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from(PRODUCTS_TABLE)
      .select('id, name, name_bn')
      .in('id', productIds);
    (products || []).forEach((p: { id: number; name: string; name_bn: string | null }) => {
      nameMap.set(p.id, p.name_bn || p.name);
    });
  }

  const answersByQuestion = new Map<number, ProductQuestionAnswer[]>();
  if (!aErr) {
    (answers as ProductQuestionAnswer[] | null || []).forEach((a) => {
      const list = answersByQuestion.get(a.question_id) || [];
      list.push(a);
      answersByQuestion.set(a.question_id, list);
    });
  }

  return rows.map((q) => ({
    ...q,
    product_name: nameMap.get(q.product_id) || `প্রোডাক্ট #${q.product_id}`,
    answers: answersByQuestion.get(q.id) || [],
  }));
}

export interface QaActionResult {
  ok: boolean;
  message?: string;
}

export async function answerQuestion(questionId: number, answerText: string): Promise<QaActionResult> {
  await requireAdmin();
  const answer = answerText.trim();
  if (!answer) return { ok: false, message: '❌ উত্তর লিখুন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(A_TABLE).insert({
    question_id: questionId,
    author_name: ADMIN_AUTHOR_NAME,
    is_admin: true,
    answer,
  });
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteQuestion(id: number): Promise<QaActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  // DB-তে ON DELETE CASCADE নিশ্চিত না থাকায় আগে সব উত্তর মুছে, তারপর প্রশ্ন মুছছি
  await supabase.from(A_TABLE).delete().eq('question_id', id);
  const { error } = await supabase.from(Q_TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: '❌ মুছতে সমস্যা: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteAnswer(id: number): Promise<QaActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(A_TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: '❌ মুছতে সমস্যা: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}
