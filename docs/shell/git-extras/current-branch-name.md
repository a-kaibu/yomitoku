---
title: "今いるブランチの名前を取り出す"
description: "現在チェックアウトしているブランチの短い名前を、Git の機能で取り出して表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [182, 184]
function: "current_branch_name"
difficulty: 1
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`current_branch_name` は、**今作業しているブランチの名前を表示する** 関数です。`main` や `feature/login` のような短い名前が出ます。

git-summary の概要に、どのブランチを見ているかを示すために使われます。作業の文脈を、ひと目で伝えるための値です。

## コード

```bash:line-numbers=182
current_branch_name() {
  git rev-parse --abbrev-ref HEAD
}
```

## 前提知識

- **ブランチ**: 作業の流れを分けて記録する、Git の目印です。
- **`HEAD`**: 今チェックアウトしている場所を指す、Git の特別な参照です。
- **`git rev-parse`**: Git の情報を、読みやすい形に変換して表示するコマンドです。
- **`--abbrev-ref`**: 参照の名前を、短い形で表示する指定です。

## 何をしているか

### 1. HEAD の短い名前を求める

```bash:line-numbers=183
  git rev-parse --abbrev-ref HEAD
```

`git rev-parse --abbrev-ref HEAD` で、HEAD が指すブランチの名前を、短い形で表示します。関数の出力は、この 1 行だけです。

## ここがすごい

- **Git に聞く**: `.git` の中身を直接読まず、Git のコマンドに名前を求めます。Git の内部の形が変わっても動きます。
- **短い名前に変換する**: `refs/heads/main` のような長い形ではなく、`main` と表示します。
- **1 行で済む**: 関数の本体は一行です。役割が明確で、読むのが容易です。

## まとめ

- Git の情報は、内部の形式を読まずにコマンドで取り出す。
- 表示用の名前は、短い形を選ぶと読みやすい。
- 一つの役割だけの関数は、一行でも十分に分かりやすい。
