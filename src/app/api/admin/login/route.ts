import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET!
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24時間

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // 管理者ユーザーを取得
    console.log('管理者ユーザー検索開始:', { username })
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    console.log('管理者ユーザー検索結果:', { admin: admin ? 'あり' : 'なし', error })

    if (error || !admin) {
      console.log('管理者ユーザーが見つかりません:', { username, error })
      
      // デバッグ用：ユーザーが存在するかチェック
      const { data: allAdmins, error: listError } = await supabaseAdmin
        .from('admin_users')
        .select('username, is_active')
      
      console.log('全管理者ユーザー:', { allAdmins, listError })
      
      // デバッグ用：admin_usersテーブルの全件確認
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        
      console.log('全管理者詳細:', { count: allUsers?.length || 0, users: allUsers, error: allUsersError })
      
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, admin.password_hash)
    console.log('パスワード検証結果:', { username, isValid, passwordLength: password.length })
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // JWTトークン生成
    const tokenPayload = {
      adminId: admin.id,
      username: admin.username,
      type: 'admin',
      exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
    }
    
    const token = jwt.sign(tokenPayload, JWT_SECRET)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

    // セッションをDBに保存
    const { error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .insert({
        admin_id: admin.id,
        token,
        expires_at: expiresAt
      })

    if (sessionError) {
      console.error('セッション保存エラー:', sessionError)
      return NextResponse.json(
        { error: 'セッション作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('管理者ログインエラー:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
} 