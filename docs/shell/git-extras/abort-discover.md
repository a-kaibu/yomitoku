---
title: "途中のマージやリベースの種類を見つける"
description: "Git の作業ディレクトリに残っている途中の操作の目印を調べ、見つかった操作の名前を表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-abort"
lines: [8, 15]
function: "discover_op"
difficulty: 2
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`discover_op` は、**Git で途中のままになっている操作を見つける** 関数です。cherry-pick、merge、rebase、revert のどれが進行中かを調べて、名前を表示します。

Git は、途中の操作の印をファイルとして残します。その印があるかを順に確かめることで、何を中断すべきかを判断します。

## コード

```bash:line-numbers=8
discover_op() {
  local op
  for op in cherry_pick merge rebase revert ; do
      if [ -f "${gitdir}/${op^^}_HEAD" ]; then
          echo "${op/_/-}"
      fi
  done
}
```

## 前提知識

- **途中の操作**: マージやリベースは、衝突などで途中で止まることがあります。そのままでは、新しい作業ができません。
- **`${gitdir}`**: Git の管理データがあるディレクトリです。前の行で `git rev-parse --git-dir` によって求めています。
- **`${op^^}`**: 変数の文字を大文字に変える、bash の書き方です。
- **`${op/_/-}`**: 最初の `_` を `-` に置き換えます。コマンドの名前に合わせた表示に使います。

## 何をしているか

### 1. 操作の候補を順に調べる

```bash:line-numbers=10
  for op in cherry_pick merge rebase revert ; do
      if [ -f "${gitdir}/${op^^}_HEAD" ]; then
```

cherry_pick、merge、rebase、revert の順に繰り返します。それぞれについて、対応する印のファイルがあるかを調べます。

### 2. 印が見つかったら名前を表示する

```bash:line-numbers=12
          echo "${op/_/-}"
      fi
```

印のファイル名は、操作名を大文字にしたものです。`${op^^}` で大文字にして確かめ、表示は `${op/_/-}` で `cherry-pick` の形に直します。

## ここがすごい

- **印で判断する**: 中身を読むのではなく、ファイルの有無だけで状態を判断します。速く、確実です。
- **表示名を分ける**: 内部の名前と、利用者に見せる名前を分けています。`cherry_pick` を `cherry-pick` と表示するためです。
- **一覧を見やすく保つ**: 候補を配列ではなく並べた単語で持つことで、短く書けています。

## まとめ

- 途中の状態は、目印のファイルの有無で判断できる。
- 内部の名前と表示の名前を分けると、読みやすい出力になる。
- 大文字化や置換を使うと、名前の変換を短く書ける。
