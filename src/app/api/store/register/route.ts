import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const {
      store_code,
      name,
      address,
      phone,
      password,
      fixed_caption,
      fixed_hashtags,
      store_description
    } = await request.json()

    // 必須項目チェック
    if (!store_code || !name || !password) {
      return NextResponse.json(
        { error: '店舗コード、店舗名、パスワードは必須です' },
        { status: 400 }
      )
    }

    // 店舗コードの重複チェック
    const { data: existingStore } = await supabase
      .from('stores')
      .select('store_code')
      .eq('store_code', store_code)
      .single()

    if (existingStore) {
      return NextResponse.json(
        { error: 'この店舗コードは既に使用されています' },
        { status: 409 }
      )
    }

    // パスワードをハッシュ化
    const password_hash = await hashPassword(password)

    // 店舗を登録
    const { data, error } = await supabase
      .from('stores')
      .insert({
        store_code,
        name,
        address: address || '',
        phone: phone || '',
        password_hash,
        fixed_caption: fixed_caption || '',
        fixed_hashtags: fixed_hashtags || '',
        store_description: store_description || ''
      })
      .select()
      .single()

    if (error) {
      console.error('店舗登録エラー:', error)
      return NextResponse.json(
        { error: '店舗の登録に失敗しました' },
        { status: 500 }
      )
    }

    // パスワードハッシュを除外して返す
    const { password_hash: _, ...newStore } = data

    return NextResponse.json({
      store: newStore,
      message: '店舗を登録しました'
    })
  } catch (error) {
    console.error('店舗登録エラー:', error)
    return NextResponse.json(
      { error: '店舗の登録に失敗しました' },
      { status: 500 }
    )
  }
} 