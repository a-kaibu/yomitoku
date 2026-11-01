---
title: "未コミットの変更の数を数える"
description: "git status の出力を機械向けの形で取り出し、変更のあるファイルの件数を表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [200, 202]
function: "uncommitted_changes_count"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`uncommitted_changes_count` は、**まだコミットしていない変更が、いくつのファイルにあるかを数える** 関数です。作業の途中の状態を、数字で示します。

コミットしていない変更が多いと、作業が溜まっているサインです。git-summary は、この数字を出して、状態を伝えます。

## コード

```bash:line-numbers=200
uncommitted_changes_count() {
  git status --porcelain | wc -l
}
```

## 前提知識

- **未コミットの変更**: ファイルを書き換えたが、まだ記録（コミット）していない状態のことです。
- **`git status --porcelain`**: 状態を、機械が読みやすい形で表示する指定です。人向けの説明文は付きません。
- **`wc -l`**: 行数を数えます。1 行が 1 つの変更に対応します。

## 何をしているか

### 1. 機械向けの状態を取り出す

```bash:line-numbers=201
  git status --porcelain | wc -l
```

`git status --porcelain` で、変更されたファイルの一覧を、読みやすい説明文なしで出します。

### 2. 行数を数える

```bash:line-numbers=201
  git status --porcelain | wc -l
```

`wc -l` で行数を数えて、変更の件数として表示します。

## ここがすごい

- **機械向けの形式を使う**: `--porcelain` は、表示の形が変わりにくいように作られています。スクリプトで読むのに向いています。
- **件数だけを返す**: ファイルの名前は表示せず、数だけを返すので、概要に収まります。
- **一行で済む**: 状態の取得と数え上げを、一本のパイプで行っています。

## まとめ

- 状態を機械で読むときは、人向けでない形式を選ぶと安定する。
- 件数だけを返すと、概要の表示に向いている。
- 変更の有無は、一覧の行数で素早く判断できる。
