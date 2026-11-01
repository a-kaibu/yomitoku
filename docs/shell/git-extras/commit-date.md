---
title: "コミットの日付だけを取り出す"
description: "git log の出力から、日付の部分だけを切り出して一覧にする関数。引数で範囲を絞れる。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [68, 72]
function: "commit_date"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`commit_date` は、**コミットの日付だけを取り出して一覧にする** 関数です。`git log` の出力から、日付の欄だけを切り出します。

日付の一覧は、作業日数などを数える材料になります。この関数は、その材料を作る最初の段階です。

## コード

::: code-group

```bash:line-numbers=68 [日本語訳]
commit_date() {
  # 引数は空でも構いません。
  # 引数の変数は、意図して分割させるため、警告を抑えています。
  git log $MERGES_ARG --pretty='format: %ai' "$1" | cut -d ' ' -f 2
}
```

```bash:line-numbers=68 [原文]
commit_date() {
  # the $1 can be empty
  # shellcheck disable=SC2086
  git log $MERGES_ARG --pretty='format: %ai' "$1" | cut -d ' ' -f 2
}
```

:::

## 前提知識

- **`git log`**: コミットの履歴を表示するコマンドです。`--pretty` で表示の形を決められます。
- **`--pretty='format: %ai'`**: コミットの日付を、空白で始まる形式で表示する指定です。`%ai` は作成日時の書式を表します。
- **`cut -d ' ' -f 2`**: 空白で区切って、2 番目の欄だけを取り出すコマンドです。
- **`$MERGES_ARG`**: マージのコミットを含めるかを決める、呼び出し側の変数です。

## 何をしているか

### 1. 日付の書式を指定して履歴を表示する

```bash:line-numbers=70
  # 引数の変数は、意図して分割させるため、警告を抑えています。
```

`git log` で、履歴の日付を指定の書式で表示します。引数が空なら、現在の枝の履歴全体になります。

### 2. 日付の欄だけを切り出す

```bash:line-numbers=71
  git log $MERGES_ARG --pretty='format: %ai' "$1" | cut -d ' ' -f 2
```

`cut` で空白区切りの 2 番目の欄を取り出します。その結果が、関数の出力になります。

## ここがすごい

- **書式を Git に任せる**: 日付の形式を自分で整える必要がなく、`%ai` の指定で一度に得られます。
- **空の引数に対応する**: コメントにあるように、引数が空でも動きます。呼び出し側が範囲を決めなくても使えます。
- **パイプで絞る**: 不要な欄を、`cut` で一度に捨てています。後続の集計がしやすい形になります。

## まとめ

- 日付のような欄の抽出は、Git の書式指定と `cut` の組み合わせで済む。
- 引数が空の場合の動きを、コメントで明記すると使いやすい。
- 後で数えるための材料は、1 行 1 件の形で出すと扱いやすい。
