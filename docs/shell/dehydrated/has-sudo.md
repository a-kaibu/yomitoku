---
title: "sudo が使えるかを確かめて、無ければ止める"
description: "DEHYDRATED_USER が設定されているのに sudo が無い場合に、理由を示してエラーで終わる関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [489, 491]
function: "has_sudo"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`has_sudo` は、**sudo が使えるかを確かめ、無ければエラーで止める** 関数です。別のユーザーとして実行する設定があるのに、sudo が入っていない場合に備えています。

設定で別のユーザーを指定しているのに、その手段が無いと、処理は途中で失敗します。最初に理由を伝えて止めるほうが、利用者には親切です。

## コード

```bash:line-numbers=489
  has_sudo() {
    command -v sudo > /dev/null 2>&1 || _exiterr "DEHYDRATED_USER set but sudo not available. Please install sudo."
  }
```

## 前提知識

- **`sudo`**: 別のユーザーの権限で、コマンドを実行する仕組みです。
- **`command -v`**: コマンドが存在するかを調べる命令です。見つからなければ、何も表示しません。
- **`> /dev/null 2>&1`**: 標準出力と標準エラーの両方を捨てる指定です。結果の表示を抑えます。
- **`_exiterr`**: 同じファイル内で定義された、エラーを表示して終わる関数です。

## 何をしているか

### 1. sudo の場所を調べる

```bash:line-numbers=490
    command -v sudo > /dev/null 2>&1 || _exiterr "DEHYDRATED_USER set but sudo not available. Please install sudo."
```

`command -v sudo` で、sudo が使える状態かを調べます。出力は捨てて、成否だけを使います。

### 2. 無ければ理由を示して終わる

```bash:line-numbers=490
    command -v sudo > /dev/null 2>&1 || _exiterr "DEHYDRATED_USER set but sudo not available. Please install sudo."
```

sudo が無いときは、`DEHYDRATED_USER` の設定に対して sudo が必要だと伝え、エラーで終了します。利用者が、次に何を入れるべきかが分かります。

## ここがすごい

- **早く失敗する**: 処理の途中で、sudo が無いことに気づくより、先に止めるほうが混乱が少ないです。
- **理由を具体的に伝える**: どの設定が原因かを、メッセージに含めています。
- **既存の終了の仕組みを使う**: エラーの表示と終了は、共通の関数に任せています。

## まとめ

- 前提となる道具は、処理の前に確かめて止めると原因が明確になる。
- エラーのメッセージには、どの設定が原因かを含める。
- 共通のエラー処理を使うと、表示の形が統一される。
