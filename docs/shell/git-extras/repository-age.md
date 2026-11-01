---
title: "一番古いコミットからの経過時間を出す"
description: "履歴の最初のコミットを選び、その作成からの経過時間を「ago」を除いた短い表記で表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [159, 161]
function: "repository_age"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`repository_age` は、**リポジトリの最初のコミットが、どのくらい前のものかを表示する** 関数です。たとえば「3 years」のような表記で出します。

プロジェクトがどれくらい続いているかを、ひと目で伝えるための値です。git-summary の概要の 1 行として使われます。

## コード

```bash:line-numbers=159
repository_age() {
  git log --reverse --pretty=oneline --format="%ar" | head -n 1 | LC_ALL=C sed 's/ago//'
}
```

## 前提知識

- **`--reverse`**: 履歴を古い順に並べる指定です。最初のコミットを先頭に持ってきます。
- **`--format="%ar"`**: コミットから今までの経過時間を、「3 years ago」のような相対的な表記で表示します。
- **`head -n 1`**: 先頭の 1 行だけを取り出します。
- **`sed 's/ago//'`**: 「ago」という文字を取り除きます。

## 何をしているか

### 1. 古い順の先頭を取り出す

```bash:line-numbers=160
  git log --reverse --pretty=oneline --format="%ar" | head -n 1 | LC_ALL=C sed 's/ago//'
```

`git log --reverse` で古い順に並べ、先頭の 1 件だけを取ります。その 1 件の経過時間が表示されます。

### 2. 「ago」を取り除く

```bash:line-numbers=160
  git log --reverse --pretty=oneline --format="%ar" | head -n 1 | LC_ALL=C sed 's/ago//'
```

`sed` で「ago」を消して、短い表記にします。`LC_ALL=C` は、表記を英語の固定の形で扱うための指定です。

## ここがすごい

- **経過時間を Git に任せる**: 日付の計算を自分で書かず、相対表記の書式をそのまま使えます。
- **表示を短くする**: 「ago」は、文脈で分かるので取り除いています。1 行の概要に収まります。
- **ロケールを固定する**: `LC_ALL=C` で、表記が環境で変わらないようにしています。

## まとめ

- 経過時間は、相対表記の書式を使えば計算を省ける。
- 表示の言葉は、一定の形に揃えると文字列の処理が安定する。
- 古い順の先頭を取るには、`--reverse` と `head` を組み合わせる。
