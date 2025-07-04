import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession } from '@/lib/admin-auth';

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!supabase) {
      return NextResponse.json(
        { error: '環境変数が設定されていません' },
        { status: 500 }
      );
    }

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

    // パラメータ取得
    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userIdとnewPasswordが必要です' }, { status: 400 });
    }

    // パスワードハッシュ化
    const hash = await bcrypt.hash(newPassword, 10);

    // DB更新
    const { error } = await supabase!
      .from('users')
      .update({ password_hash: hash })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'パスワード更新に失敗しました', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'サーバーエラー', detail: String(e) }, { status: 500 });
  }
} 