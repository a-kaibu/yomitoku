# ヨクヨム

有名 OSS のコードを **関数ひとつずつ**、その言語を知らない人にもわかる日本語で解説するコードリーディングサイトです。

- サイト: https://a-kaibu.github.io/yokuyomu/
- 対応言語: C / C++ / Go / Rust / C# / TypeScript / Swift / Kotlin / Java / シェルスクリプト / Python / Ruby
- 記事の書き方・フォーマット: [CONTRIBUTING.md](CONTRIBUTING.md)

## 開発

```sh
npm ci
npm run dev        # http://localhost:5173/yokuyomu/
npm run validate   # 記事フォーマットの検証
npm run build      # 本番ビルド（ハブ + 言語ごとに分割ビルドして結合）
npm run preview
```

`main` に push すると GitHub Actions が検証・ビルドし、GitHub Pages にデプロイします
（リポジトリの Settings → Pages → Source を「GitHub Actions」にしておく必要があります）。

## 構成

```
docs/
├─ index.md                   ハブ（トップ）
├─ <言語>/index.md            言語トップ（一覧は frontmatter から自動生成）
├─ <言語>/<プロジェクト>/<関数>.md   記事
└─ .vitepress/
   ├─ config.mts              VitePress 設定（サイドバー・一覧データの生成、分割ビルド）
   ├─ shared.mjs              言語・タグ・ライセンスなどの共有定数
   ├─ meta.mjs                記事ローダー
   └─ theme/                  テーマ（出典ボックス、言語カード、記事一覧など）
scripts/
├─ validate.mjs               フォーマット検証（--verify-source で引用コードを GitHub と照合）
├─ new-entry.mjs              記事のひな形作成
└─ build.mjs                  分割ビルドと結合
```

## ライセンス

解説文は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)。
引用しているコードの著作権は各プロジェクトの著作者にあり、各記事に記載したライセンスに従います。
