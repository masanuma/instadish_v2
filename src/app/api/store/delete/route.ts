import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const admin = await validateAdminSession(token);
    if (!admin) {
      return NextResponse.json({ error: '管理者認証に失敗しました' }, { status: 401 });
    }

    // storeId取得
    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ error: 'storeIdが必要です' }, { status: 400 });
    }

    // 論理削除
    const { error } = await supabase
      .from('stores')
      .update({ is_deleted: true })
      .eq('id', storeId);

    if (error) {
      return NextResponse.json({ error: '削除に失敗しました', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'サーバーエラー', detail: String(e) }, { status: 500 });
  }
} 