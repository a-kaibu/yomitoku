# ヨミトク

記事を追加・編集するときは必ず CONTRIBUTING.md のフォーマットに従うこと。

- 言語ごとの作業では `docs/<言語>/` 以下だけを編集する。`docs/.vitepress/`、`docs/<言語>/index.md`、`scripts/`、`package.json`、`.github/` は共有ファイルなので変更しない（必要なら依頼する）。
- push 前に `npm run validate -- --verify-source docs/<言語>` をエラー 0 にする。
- 複数の作業が同時に main へ push するので、push 前に `git pull --rebase origin main`。
- 引用コードは元ファイルの該当行をそのまま貼る（省略・改変・翻訳しない）。80 行以内。commit は 40 桁 SHA をクォートして固定。
- ライセンスはリポジトリの LICENSE とファイルヘッダの両方で確認し、許可リスト（docs/.vitepress/shared.mjs）にあるものだけ。
