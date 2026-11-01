---
title: "利用規約の URL を表示して終わる"
description: "初期化をしたうえで、現在の利用規約の場所を表示し、完了を示して終了する関数。コマンドの一つとして使われる。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1771, 1776]
function: "command_terms"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`command_terms` は、**認証局の利用規約の場所を表示して、終了する** 関数です。`dehydrated` の `--terms` という指定で、この関数が呼ばれます。

証明書を発行する認証局には、利用規約があります。規約に同意するかどうかを判断するために、その場所を利用者に示します。

## コード

```bash:line-numbers=1771
command_terms() {
  init_system
  echo "The current terms of service: $CA_TERMS"
  echo "+ Done!"
  exit 0
}
```

## 前提知識

- **`init_system`**: 設定や環境を整える、同じファイル内の関数です。ほかの処理の前に、必ず呼ばれます。
- **`$CA_TERMS`**: 利用規約の場所を表す変数です。認証局ごとに決まります。
- **`exit 0`**: 正常終了を示して、スクリプトを止めます。
- **コマンドの関数**: `dehydrated` には、この関数のように、指定に対応する処理がまとめられています。

## 何をしているか

### 1. 環境を整える

```bash:line-numbers=1772
  init_system
```

`init_system` を呼んで、設定や必要なものを準備します。

### 2. 利用規約の場所を表示する

```bash:line-numbers=1773
  echo "The current terms of service: $CA_TERMS"
```

現在の利用規約の場所を、表示します。

### 3. 完了を表示して終わる

```bash:line-numbers=1774
  echo "+ Done!"
  exit 0
```

完了のメッセージを出し、正常終了で止めます。

## ここがすごい

- **処理を 1 つに絞る**: 関数が担うのは、規約の場所を出すことだけです。他の処理と混ざりません。
- **準備を省かない**: 必ず `init_system` を通るので、設定の読み込み漏れがありません。
- **終了の形がそろう**: 他のコマンドの関数と同じく、完了を表示して終わる書き方になっています。

## まとめ

- コマンドごとの処理は、1 つの役割に絞ると分かりやすい。
- 必要な準備は、処理の前に共通の関数で済ませる。
- 同じ形で終わる関数をそろえると、利用者にも読み手にも扱いやすい。
