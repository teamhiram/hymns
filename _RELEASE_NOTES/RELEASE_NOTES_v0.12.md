# リリースノート - Version 0.12

2026/01/20

## Version 0.12

### 破壊的変更（データスキーマ）

- **JSONの歌詞配列キーを `lyrics` に統一**
  - `json-data-set/jp-dai-uta-web.json`: `utayaku` → `lyrics`
  - `json-data-set/jp-sup-uta-web.json`: `utayaku` → `lyrics`
  - `json-data-set/jp-sup-zen-web.json`: `utayaku` → `lyrics`
  - `json-data-set/jp-dai-zen-web.json`: `zennyaku` → `lyrics`
  - `json-data-set/ch-dai-web.json`: `traditional-chinese` → `lyrics`

### データ更新（補充本）

- **補充本 歌訳（日本語）データの追加**
  - `json-data-set/jp-sup-uta-web.json` を追加/更新（`number/id/title/lyrics`）
  - 曲数: 365（`9001` を含む）

- **補充本 全訳（日本語）データの整備**
  - `prep/scraping-jp-sup-zen/data/jp-sup-zen-raw-cleanse.json` をクレンジング
    - 冒頭の「歌詞」除去
    - 節番号を単独行化（前後改行）
    - 行頭の不要スペース除去
    - 先頭に残っていた番号・（英xxxx）表記の除去
  - 364曲の完全性チェック（空データなし・JSON妥当）

- **補充本 全訳web JSONの再生成**
  - `json-data-set/jp-sup-zen-web.json` を `jp-sup-uta-web.json` と同じ構造（`number/id/title/lyrics`）で生成・上書き
  - 曲数: 364（補充本は 9001 の全訳なし）

### 開発者向け（変換スクリプト）

- **補充本 全訳→web 変換スクリプトを追加/更新**
  - `prep/scraping-jp-sup-zen/convert_to_web_json.py`
  - `prep/scraping-jp-sup-uta/convert_to_web_json.py`（出力キーを `lyrics` に更新）

### UX / デバッグ支援

- **ページ内「キャッシュ削除」ボタンを追加**
  - フォント設定メニュー内に追加
  - Cache Storage の削除 + Service Worker の登録解除 + リロードを実行

### パフォーマンス / キャッシュ

- **Service Worker キャッシュバージョン更新**
  - `service-worker.js`: `CACHE_NAME` を `hymns-v5` に更新

