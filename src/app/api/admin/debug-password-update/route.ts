import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/admin-auth'

export async function GET() {
  try {
    console.log('=== パスワード更新デバッグ開始 ===')
    
    // usersテーブルの構造確認
    let tableInfo, tableError;
    try {
      const result = await supabaseAdmin.rpc('get_table_info', { table_name: 'users' })
      tableInfo = result.data || 'RPC not available'
      tableError = result.error
    } catch (err) {
      tableInfo = null
      tableError = 'RPC failed'
    }

    // usersテーブルの存在確認（alternative method）
    let usersTableCheck;
    try {
      const { data: usersList, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1)
      
      usersTableCheck = {
        exists: !usersError,
        error: usersError?.message,
        sampleData: usersList?.[0] ? {
          id: usersList[0].id,
          hasPasswordHash: !!usersList[0].password_hash,
          columns: Object.keys(usersList[0])
        } : null
      }
    } catch (err) {
      usersTableCheck = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // storesテーブルも確認（管理画面で表示されているテーブル）
    let storesTableCheck;
    try {
      const { data: storesList, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('*')
        .limit(1)
      
      storesTableCheck = {
        exists: !storesError,
        error: storesError?.message,
        sampleData: storesList?.[0] ? {
          id: storesList[0].id,
          hasPasswordHash: !!storesList[0].password_hash,
          columns: Object.keys(storesList[0])
        } : null
      }
    } catch (err) {
      storesTableCheck = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 認証テスト用のダミートークン生成
    const testToken = 'dummy-token-for-testing'
    
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        tables: {
          users: usersTableCheck,
          stores: storesTableCheck
        },
        tableInfo,
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasJwtSecret: !!process.env.JWT_SECRET
        }
      }
    })

  } catch (error) {
    console.error('デバッグエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword, testAuth } = await request.json()
    
    console.log('=== POST デバッグパスワード更新試行 ===')
    console.log('リクエスト:', { userId, passwordLength: newPassword?.length, testAuth })

    // 認証チェック（testAuthが true の場合はスキップ）
    if (!testAuth) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ 
          success: false, 
          error: '認証情報がありません',
          debug: { hasAuthHeader: !!authHeader, authHeaderStart: authHeader?.substring(0, 20) }
        }, { status: 401 });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const admin = await validateAdminSession(token);
      if (!admin) {
        return NextResponse.json({ 
          success: false, 
          error: '管理者認証に失敗しました',
          debug: { tokenStart: token.substring(0, 20) }
        }, { status: 401 });
      }
    }

    // ユーザー/店舗の存在確認
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        userCheck: {
          exists: !!user,
          error: userError?.message,
          data: user ? { id: user.id, hasPasswordHash: !!user.password_hash } : null
        },
        storeCheck: {
          exists: !!store,
          error: storeError?.message,
          data: store ? { id: store.id, hasPasswordHash: !!store.password_hash } : null
        },
        recommendedTable: user ? 'users' : store ? 'stores' : 'none'
      }
    })

  } catch (error) {
    console.error('POSTデバッグエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 