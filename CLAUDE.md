# 頭骨タワーバトル — CLAUDE.md

## プロジェクト概要

「動物タワーバトル」の頭骨版。一般社団法人路上博物館（Rojohaku）の実標本3Dスキャンデータを使った、ブラウザで動く積み上げゲーム。教育・PR用途で、路上博物館の標本ページへの導線も兼ねる。

- GitHub: `memento42429/skull-tower-battle`
- 公開URL: `https://memento42429.github.io/skull-tower-battle/`（gh-pagesブランチ）
- 物理エンジン: Matter.js 0.19.0（CDN読み込み）

## リポジトリ構成

```
skull-tower-battle/
├── src/
│   ├── images.js     # 標本画像（base64） — 通常は編集不要、約65KB
│   ├── skulls.js      # 標本データ（種名・学名・体重・URL・当たり判定頂点）
│   ├── physics.js     # ゲーム定数・島生成・createSkullBody
│   ├── render.js       # 描画ロジック（drawSkullShape, drawFrame）
│   ├── game.js          # ゲームループ・スコア・UI更新・リスタート
│   └── style.css         # スタイル
├── index.template.html   # HTMLテンプレート（/* @inject filename */ で各srcを注入）
├── build.py                # src/ を template に注入し dist/index.html を生成
├── v01/ 〜 v04/             # バージョン履歴（過去のスナップショット、保存用）
├── index.html               # バージョン一覧ページ
└── dist/index.html          # ビルド済み配布用（gh-pagesに反映する元）
```

### ビルド方法
```bash
python3 build.py
# → dist/index.html が生成される
```

修正は必ず `src/` 配下のファイルを編集し、HTMLを直接編集しない（旧くは単一HTMLで全部直接編集していたが、トークン消費が大きく非効率だったため src/ 分割構成に移行した）。

## ブランチ運用

- `main`: 開発の本流
- `gh-pages`: 公開用。`dist/index.html` をルートの `index.html` として配置している
- 機能単位・実験的な変更は `claude/機能名` のようなブランチを切り、動作確認後にmainへマージしてブランチ削除する
- 1〜2行の軽微な修正はmainに直接commitしてよい

## 作業フロー（重要・厳守）

1. **Kentから修正依頼が来たら、まず該当する `src/` ファイルのみ読み込む**（全体を読まない）
2. 修正を実施
3. **必ず `node --check` で構文チェックする**（毎回・例外なし）
4. GitHubにpush（コミットメッセージは日本語で簡潔に、何を直したか明記）
5. **Kentが「試遊させて」と明示的に言うまでビルド・提示しない**
6. Kentが「修正して」と言う前に勝手にコードを変更しない。質問には説明のみで答える

### Kentの作業スタイル
- 依頼した部分以外を一緒に直されることを嫌う。指示範囲外の修正は厳禁
- 「なぜ？」という質問は原因説明のみを求めている。修正の許可ではない
- 試遊の指示があるまでpresent_filesしない
- バージョンを上書きせず、個別に保存してほしい（v01, v02...のように）

## 既知の技術的課題と対処

### `Bodies.fromVertices` の重心ズレ問題
Matter.jsの `fromVertices` は内部で頂点群の重心を再計算し、指定座標とは異なる位置に `body.position` を設定する。これにより画像描画位置と物理ボディの当たり判定がズレる。

**対処：** `createSkullBody`（physics.js）内で、指定頂点群の視覚的中心（バウンディングボックス中心）と実際の `body.position` のズレを計算し、`body.renderOffsetX` / `body.renderOffsetY` に保存。`render.js` の描画時にこのオフセットを加算して補正している。

ただしこの補正は完全ではなく、特に非対称で細長い形状（ツノシマクジラ等）でズレが残ることがある。完全解決には至っていない。

### poly-decomp導入は試して却下
凹形状の当たり判定精度を上げるためpoly-decompを試したが、見た目のズレが悪化したため見送り、`true`（凸包扱い）の設定に戻した。再挑戦する場合は `Common.setDecomp(decomp)` の設定と `fromVertices` 第4引数 `false` が必要だったことを覚えておく。

### 当たり判定生成の元になっている手法
各標本のPNG画像（アルファチャンネルで背景透過済み）から、Pythonで以下の手順で凸包頂点を生成している：
1. アルファ>10のピクセルから`scipy.spatial.ConvexHull`で凸包を計算
2. 頂点数を16点程度に間引き
3. 凸包の重心を計算し、原点（0,0）として頂点を正規化
4. 体重ベースで決めた `rw`（幅）に合わせてスケール

この処理スクリプトは特定のセッションでのみ実行されており、リポジトリには手順が残っていない。再生成が必要な場合は同様のロジックを再実装する。

## SKULLSデータ（src/skulls.js）の構造

```js
{
  id:         'lion',                  // ファイル識別子（images.js, physics.jsと対応）
  nameJp:     'ライオン',               // 和名
  nameSci:    'Panthera leo',           // 学名
  weight:     126,                       // 体重(kg) — サイズとスコア計算に使用
  specimenNo: 'NSMT-M42347',             // 標本番号
  storage:    '国立科学博物館',          // 収蔵館
  fact:        '...',                    // ゲームオーバー時の解説文
  url:        'https://rojohaku.com/...',// 路上博物館 標本ページへのリンク
  rw, rh:     幅・高さ(px)               // 体重の対数スケールで計算（島幅200pxの1/10〜1/4）
  verts:      [{x,y}, ...]               // 当たり判定の凸包頂点（重心基準）
  scale:      1.0                        // 現状未使用の名残、削除候補
}
```

### 現在の9種
ライオン、ツノシマクジラ、サバンナシマウマ、ドリル、ツチクジラ、ヒト、マレーバク、カバ、アジアゾウ

### 画像素材の出どころ
Sketchfabの各標本ページのスクリーンショットを、iOSの「被写体を持ち上げる」機能でステッカー化 → PNGとして保存 → アップロード、という手順で背景透過PNGを作成した。元のHEICファイルはBoxの `skull-tower-battle/assets/skulls/` に格納されているが、ステッカー化前のスクリーンショットであり透明情報を含んでいない可能性が高い（未検証）。

## ゲームメカニクスの現状仕様

- 物理: 重力1.2、frictionAir 0.05、役物のfriction 1.0/frictionStatic 10.0、restitution 0.0
- 島: 中央配置、幅200px、左右に高さ16pxの段差（ストッパー）あり
- 操作: マウス/タッチ押下中は時計回りに回転、離すと落下
- ゲームオーバー判定: 役物が島の縁より30px上に出る、または画面外（CANVAS_H超え）に落下
- スコア: `Math.max(10, Math.round(Math.log10(weight+1) * 20))`（重い種ほど高得点）

## 今後の課題（未着手）

- 連打対応（前の役物の着地を待たずに次を投下できるようにしたい、と相談はしたが未着手）
- HEIC→透明PNG変換の検証
- `scale`フィールドの削除（未使用）
