---
title: "証明書の発行者の印を、openssl で取り出す"
description: "指定された証明書ファイルから、発行者のハッシュ値を openssl に求めさせて表示する関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1476, 1479]
function: "get_issuer_hash"
difficulty: 2
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`get_issuer_hash` は、**証明書を発行したところの印（ハッシュ値）を取り出す** 関数です。証明書の連鎖をたどるときに、発行者を照合する材料になります。

証明書は、誰が発行したかの情報を持っています。その名前を直接比べるより、ハッシュ値で比べるほうが、表記の揺れに強いです。

## コード

```bash:line-numbers=1476
get_issuer_hash() {
  certificate="${1}"
  "${OPENSSL}" x509 -in "${certificate}" -noout -issuer_hash
}
```

## 前提知識

- **証明書の発行者**: 証明書に署名した認証局の情報です。
- **ハッシュ値**: 長さの決まった印を、データから計算した値です。同じデータからは同じ値が出ます。
- **`openssl x509`**: 証明書を読むための openssl のコマンドです。
- **`-issuer_hash`**: 発行者の名前から計算したハッシュ値を表示する指定です。
- **`${OPENSSL}`**: openssl のコマンドの場所を表す変数です。設定で差し替えられます。

## 何をしているか

### 1. 証明書のファイル名を受け取る

```bash:line-numbers=1477
  certificate="${1}"
```

引数で指定された証明書のファイルの名前を、変数に入れます。

### 2. 発行者のハッシュ値を求める

```bash:line-numbers=1478
  "${OPENSSL}" x509 -in "${certificate}" -noout -issuer_hash
```

`openssl x509` に、証明書のファイルと `-issuer_hash` を渡します。出力された値が、この関数の結果になります。

## ここがすごい

- **表記の揺れに強い**: 名前の文字列ではなく、計算されたハッシュで比べるため、大文字小文字や空白の違いに左右されません。
- **外部の道具に任せる**: 証明書の読み方を自分で書かず、openssl の機能を使っています。
- **命令の場所を変えられる**: `${OPENSSL}` を通して呼ぶので、別の openssl を使う環境でも対応できます。

## まとめ

- 比較には、表記ではなく計算された値を使うと確実。
- 暗号の処理は、信頼できる道具の機能に任せる。
- 道具の場所を変数にしておくと、環境の違いに対応しやすい。
