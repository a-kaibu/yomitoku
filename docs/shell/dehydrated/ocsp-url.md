---
title: "証明書から OCSP の確認先の URL を取り出す"
description: "指定された証明書から、OCSP（失効の確認）のサーバーの URL を openssl で取り出して表示する関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1481, 1484]
function: "get_ocsp_url"
difficulty: 2
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`get_ocsp_url` は、**証明書に書かれた OCSP のサーバーの URL を取り出す** 関数です。OCSP は、証明書がまだ有効かを問い合わせる仕組みです。

証明書には、失効の確認先が書かれていることがあります。その URL を取り出せると、確認の処理を自動で行えます。

## コード

```bash:line-numbers=1481
get_ocsp_url() {
  certificate="${1}"
  "${OPENSSL}" x509 -in "${certificate}" -noout -ocsp_uri
}
```

## 前提知識

- **OCSP**: 証明書が取り消されていないかを、認証局のサーバーに問い合わせる仕組みです。
- **証明書の拡張情報**: 証明書の中に、確認先の情報などを書き込む欄があります。
- **`openssl x509 -ocsp_uri`**: 証明書の中の OCSP の URL を表示する指定です。
- **`${OPENSSL}`**: openssl のコマンドの場所を表す変数です。

## 何をしているか

### 1. 証明書のファイル名を受け取る

```bash:line-numbers=1482
  certificate="${1}"
```

引数で指定された証明書のファイル名を、変数に入れます。

### 2. OCSP の URL を取り出す

```bash:line-numbers=1483
  "${OPENSSL}" x509 -in "${certificate}" -noout -ocsp_uri
```

`openssl x509` に `-ocsp_uri` を付けて、証明書の中の OCSP の URL を表示させます。その値が、この関数の結果です。

## ここがすごい

- **証明書の中身に従う**: URL を決め打ちせず、証明書に書かれた値をそのまま使います。
- **1 行で済む**: 読み取りの仕組みを自分で書かず、openssl の指定に任せています。
- **失効の確認の入り口になる**: この URL を使えば、後の確認処理を組み立てられます。

## まとめ

- 証明書の情報は、決め打ちせず中身から取り出す。
- 暗号の情報の読み取りは、専用の道具の指定で済ませると確実。
- 取り出した値は、後の処理の入り口として使いやすくする。
