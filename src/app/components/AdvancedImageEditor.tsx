'use client'

import { useState } from 'react'

interface AdvancedImageEditorProps {
  image: string
  onEdit: (editedImageUrl: string) => void
  onCancel: () => void
}

interface AIEditOptions {
  [key: string]: Record<string, any>
}

interface OptionConfig {
  type: string
  min?: number
  max?: number
  default: any
  label: string
  options?: Array<{ value: string; label: string }>
}

interface EditTypeConfig {
  id: string
  name: string
  description: string
  options: Record<string, OptionConfig>
}

export default function AdvancedImageEditor({ image, onEdit, onCancel }: AdvancedImageEditorProps) {
  const [selectedEditType, setSelectedEditType] = useState<string>('')
  const [editOptions, setEditOptions] = useState<AIEditOptions>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const editTypes: EditTypeConfig[] = [
    {
      id: 'background_blur',
      name: '背景ボケ効果',
      description: '背景をボケさせて被写体を強調',
      options: {
        blurStrength: { type: 'range', min: 10, max: 90, default: 50, label: 'ボケ強度' }
      }
    },
    {
      id: 'lighting_enhancement',
      name: '照明最適化',
      description: '照明効果を最適化',
      options: {
        lightingType: { 
          type: 'select', 
          options: [
            { value: 'natural', label: '自然光' },
            { value: 'studio', label: 'スタジオ光' },
            { value: 'warm', label: '暖かい光' },
            { value: 'dramatic', label: 'ドラマチック' },
            { value: 'bright', label: '明るい光' }
          ],
          default: 'natural',
          label: '照明タイプ'
        }
      }
    },
    {
      id: 'composition_optimization',
      name: '構図最適化',
      description: '構図を最適化',
      options: {
        compositionStyle: {
          type: 'select',
          options: [
            { value: 'overhead', label: 'オーバーヘッド' },
            { value: 'angle45', label: '45度アングル' },
            { value: 'closeup', label: 'クローズアップ' },
            { value: 'wide', label: 'ワイド' },
            { value: 'centered', label: '中央配置' }
          ],
          default: 'overhead',
          label: '構図スタイル'
        }
      }
    },
    {
      id: 'style_transfer',
      name: 'スタイル転送',
      description: '写真のスタイルを変更',
      options: {
        style: {
          type: 'select',
          options: [
            { value: 'vintage', label: 'ビンテージ' },
            { value: 'modern', label: 'モダン' },
            { value: 'rustic', label: 'ラスティック' },
            { value: 'elegant', label: 'エレガント' },
            { value: 'casual', label: 'カジュアル' }
          ],
          default: 'modern',
          label: 'スタイル'
        }
      }
    },
    {
      id: 'texture_enhancement',
      name: 'テクスチャ強調',
      description: '食材のテクスチャを強調',
      options: {
        enhancementType: {
          type: 'select',
          options: [
            { value: 'general', label: '全般' },
            { value: 'crispy', label: 'サクサク' },
            { value: 'smooth', label: 'なめらか' },
            { value: 'juicy', label: 'ジューシー' },
            { value: 'fresh', label: 'フレッシュ' }
          ],
          default: 'general',
          label: '強調タイプ'
        }
      }
    }
  ]

  const handleEditTypeChange = (editType: string) => {
    setSelectedEditType(editType)
    setError('')
    
    // デフォルトオプションを設定
    const editTypeConfig = editTypes.find(type => type.id === editType)
    if (editTypeConfig) {
      const defaultOptions: Record<string, any> = {}
      Object.entries(editTypeConfig.options).forEach(([key, config]) => {
        defaultOptions[key] = config.default
      })
      setEditOptions({ [editType]: defaultOptions })
    }
  }

  const handleOptionChange = (key: string, value: any) => {
    setEditOptions(prev => ({
      ...prev,
      [selectedEditType]: {
        ...(prev[selectedEditType] || {}),
        [key]: value
      }
    }))
  }

  const handleProcess = async () => {
    if (!selectedEditType) {
      setError('編集タイプを選択してください')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/ai-image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          editType: selectedEditType,
          options: editOptions[selectedEditType as keyof AIEditOptions]
        })
      })

      if (response.ok) {
        const result = await response.json()
        onEdit(result.processedImage)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'AI画像編集でエラーが発生しました')
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderOptionInput = (key: string, config: OptionConfig) => {
    const currentValue = editOptions[selectedEditType]?.[key] || config.default

    if (config.type === 'range') {
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}: {currentValue}
          </label>
          <input
            type="range"
            min={config.min}
            max={config.max}
            value={currentValue}
            onChange={(e) => handleOptionChange(key, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )
    }

    if (config.type === 'select' && config.options) {
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
          </label>
          <select
            value={currentValue}
            onChange={(e) => handleOptionChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {config.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">AI画像編集</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 元画像 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">元画像</h3>
              <img
                src={image}
                alt="元画像"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            {/* 編集オプション */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  編集タイプ
                </label>
                <select
                  value={selectedEditType}
                  onChange={(e) => handleEditTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">編集タイプを選択</option>
                  {editTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEditType && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    {editTypes.find(t => t.id === selectedEditType)?.name}の設定
                  </h4>
                  {Object.entries(editTypes.find(t => t.id === selectedEditType)?.options || {}).map(([key, config]) =>
                    renderOptionInput(key, config)
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || !selectedEditType}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isProcessing ? '処理中...' : 'AI編集を実行'}
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>

              {isProcessing && (
                <div className="text-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  AI画像編集を実行中...（10-30秒程度かかります）
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 