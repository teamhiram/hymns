# リリースノート - Version 0.1

2026/01/05

## Version 0.1

### 新機能
- **詩歌サイトの立ち上げ**
  - サブドメインでのサイト公開
  - 基本的な詩歌閲覧機能の実装

- **検索機能**
  - 検索窓の設置
  - 詩歌番号やタイトルでの検索に対応
  - 検索結果に詩歌1行目のプレビューを表示

- **ナビゲーション機能**
  - 前後の詩歌に移動するナビゲーションボタンを設置
  - キーボード操作（左右矢印キー）での移動に対応

### データ収集
- **日本語詩歌データのスクレイピング**
  - 歌訳データ：`https://ersg.jp/hymnal/001.htm` 〜 `https://ersg.jp/hymnal/780.htm`、`https://ersg.jp/hymnal/S01.htm` 〜 `https://ersg.jp/hymnal/S07.htm`
  - 全訳データ：`https://ersg.jp/hymnal_all/l001.htm` 〜 `https://ersg.jp/hymnal_all/l780.htm`、`https://ersg.jp/hymnal_all/sl001.htm` 〜 `https://ersg.jp/hymnal_all/sl007.htm`
  - MP3音声ファイル：
    - `https://ersg.jp/mp3/001.mp3` 〜 `https://ersg.jp/mp3/780.mp3`（そのまま保存）
    - `https://ersg.jp/mp3/S01.mp3` 〜 `https://ersg.jp/mp3/S07.mp3`（ファイル名を`1001.mp3` 〜 `1007.mp3`として保存）

- **中国語詩歌データの取得**
  - `chinese-hymnal.txt`（繁体字版）
  - `simplified-chinese-hymnal.txt`（簡体字版）
  - ソース：`https://github.com/ReganRyanNZ/songbase/tree/master/db`

### データ処理
- スクレイピングしたデータをテキストファイル形式で保存
- 詩歌データをJSON形式にパースしてWebサイトで利用可能な形式に変換

