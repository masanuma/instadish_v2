import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// 店舗情報取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const store = await validateSession(token)
    if (!store) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      )
    }

    // パスワードハッシュを除外して返す
    const { password_hash, ...storeData } = store

    return NextResponse.json({
      store: storeData
    })
  } catch (error) {
    console.error('店舗情報取得エラー:', error)
    return NextResponse.json(
      { error: '店舗情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 店舗情報更新
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const store = await validateSession(token)
    if (!store) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      )
    }

    const {
      name,
      address,
      phone,
      fixed_caption,
      fixed_hashtags,
      store_description
    } = await request.json()

    // 必須項目チェック
    if (!name) {
      return NextResponse.json(
        { error: '店舗名は必須です' },
        { status: 400 }
      )
    }

    // 店舗情報を更新
    const { data, error } = await supabase
      .from('stores')
      .update({
        name,
        address: address || '',
        phone: phone || '',
        fixed_caption: fixed_caption || '',
        fixed_hashtags: fixed_hashtags || '',
        store_description: store_description || ''
      })
      .eq('id', store.id)
      .select()
      .single()

    if (error) {
      console.error('店舗情報更新エラー:', error)
      return NextResponse.json(
        { error: '店舗情報の更新に失敗しました' },
        { status: 500 }
      )
    }

    // パスワードハッシュを除外して返す
    const { password_hash, ...updatedStore } = data

    return NextResponse.json({
      store: updatedStore,
      message: '店舗情報を更新しました'
    })
  } catch (error) {
    console.error('店舗情報更新エラー:', error)
    return NextResponse.json(
      { error: '店舗情報の更新に失敗しました' },
      { status: 500 }
    )
  }
} 