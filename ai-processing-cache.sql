-- AI処理結果キャッシュテーブル
CREATE TABLE ai_processing_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  effect_strength VARCHAR(20) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- インデックス作成（検索性能向上）
CREATE INDEX idx_ai_cache_lookup ON ai_processing_cache(image_hash, business_type, effect_strength);
CREATE INDEX idx_ai_cache_expires ON ai_processing_cache(expires_at);

-- 複合ユニーク制約（同じ条件での重複を防ぐ）
CREATE UNIQUE INDEX idx_ai_cache_unique ON ai_processing_cache(image_hash, business_type, effect_strength);

-- 自動クリーンアップ用の関数
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_processing_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定期的なクリーンアップ用のトリガー（オプション）
-- 注意: 本番環境ではcronジョブを使用することを推奨
CREATE OR REPLACE FUNCTION trigger_cleanup_ai_cache()
RETURNS trigger AS $$
BEGIN
  -- 新しいレコードが挿入された時に古いキャッシュをクリーンアップ
  PERFORM cleanup_expired_ai_cache();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_ai_cache_trigger
  AFTER INSERT ON ai_processing_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_ai_cache();

-- キャッシュ統計用のビュー
CREATE VIEW ai_cache_stats AS
SELECT 
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/3600) as avg_cache_hours
FROM ai_processing_cache; 