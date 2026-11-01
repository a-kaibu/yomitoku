---
title: "引数の有無で、base64 の復号の書き方を変える"
description: "base64 の復号を、改行を許す形と、1 行にまとめた形の 2 通りで行う関数。環境変数で openssl の場所を変えられる。"
language: shell
project: "acme.sh"
repo: https://github.com/acmesh-official/acme.sh
license: "GPL-3.0-only"
copyright: "Copyright (c) acme.sh contributors"
commit: "37d064f7b580055d3f2ddf9a9c960f754f3694d6"
file: "acme.sh"
lines: [1009, 1015]
function: "_dbase64"
difficulty: 1
format: 2
tags: [暗号, イディオム, 移植性]
---
## ひとことで

`_dbase64` は、標準入力の base64 を **元のバイナリに戻す** 関数です。引数があるかどうかで、復号のオプションを切り替えます。

base64 のデータは、改行で折り返されていることがあります。引数が付いているときは、その普通の形で復号します。引数が無いときは `-A` を付けて、1 行にまとまったデータとして扱います。

## コード

```bash:line-numbers=1009
_dbase64() {
  if [ "$1" ]; then
    ${ACME_OPENSSL_BIN:-openssl} base64 -d
  else
    ${ACME_OPENSSL_BIN:-openssl} base64 -d -A
  fi
}
```

## 前提知識

- **base64 の復号**: base64 で書かれた文字列を、元のバイナリに戻す処理です。`openssl base64 -d` で行えます。
- **`-A`**: openssl の base64 に、入力が 1 行にまとめられていることを伝えるオプションです。
- **`${ACME_OPENSSL_BIN:-openssl}`**: openssl のコマンドの名前を、環境変数から取り出します。設定が無ければ `openssl` を使います。
- **`if [ "$1" ]`**: 引数が空でなければ真になります。

## 何をしているか

### 1. 引数があるとき

```bash:line-numbers=1010
  if [ "$1" ]; then
    ${ACME_OPENSSL_BIN:-openssl} base64 -d
```

引数が指定されていれば、`openssl base64 -d` で復号します。改行を含んだ入力も、そのまま扱えます。

### 2. 引数がないとき

```bash:line-numbers=1013
    ${ACME_OPENSSL_BIN:-openssl} base64 -d -A
```

引数がなければ、`-A` を付けて復号します。入力は 1 行にまとまっている前提です。

どちらの場合も、openssl の場所は環境変数で差し替えられます。

## ここがすごい

- **環境変数で道具を選べる**: 同じ openssl でも、場所や種類が違う環境があります。その違いを、環境変数で受け入れられるようにしています。
- **入力の形で書き方を変える**: 1 行か複数行かによって、同じ目的のコマンドを使い分けています。
- **既定値を用意する**: 環境変数が無くても、普通の `openssl` で動きます。

## まとめ

- 外部のツールの場所は、環境変数で差し替えられるようにすると柔軟になる。
- 入力の形によって、同じ処理でもオプションを変えることがある。
- 既定値を決めておくと、設定が無くても動く。
