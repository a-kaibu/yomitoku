---
title: "証明書の発行者の CN を取り出す"
description: "証明書の連鎖の最後の証明書を選び、openssl で発行者の情報を出して、その CN の部分だけを表示する関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1145, 1147]
function: "get_last_cn"
difficulty: 3
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`get_last_cn` は、**証明書の発行者の CN（一般名）を取り出す** 関数です。CN は、発行者の名前を表す欄です。

証明書は、複数の証明書がつながった形で渡されることがあります。その中で最後の証明書の発行者を見て、名前を取り出します。

## コード

```bash:line-numbers=1145
get_last_cn() {
  <<<"${1}" _sed 'H;/-----BEGIN CERTIFICATE-----/h;$!d;x' | "${OPENSSL}" x509 -noout -issuer | head -n1 | _sed -e 's/.*[ /]CN ?= ?([^/,]*).*/\1/'
}
```

## 前提知識

- **証明書の連鎖**: 証明書は、発行者の証明書を次々にたどって、信頼の根まで続きます。
- **CN（Common Name）**: 証明書の中の、名前を表す項目です。発行者の欄にも含まれます。
- **`openssl x509 -issuer`**: 証明書の発行者の情報を表示する指定です。
- **`sed` の `H` と `h` と `x`**: 行を保持領域に集めたり、取り出したりする sed の命令です。ここでは、最後の証明書の部分だけを残すために使われます。
- **`${OPENSSL}`**: openssl のコマンドの場所を表す変数です。

## 何をしているか

### 1. 最後の証明書だけを残す

```bash:line-numbers=1146
  <<<"${1}" _sed 'H;/-----BEGIN CERTIFICATE-----/h;$!d;x' | "${OPENSSL}" x509 -noout -issuer | head -n1 | _sed -e 's/.*[ /]CN ?= ?([^/,]*).*/\1/'
```

`sed` で、証明書の開始の行を見つけるたびに保持領域を更新し、最後の証明書だけを残します。その結果を、openssl に渡します。

### 2. 発行者の情報を出す

```bash:line-numbers=1146
  <<<"${1}" _sed 'H;/-----BEGIN CERTIFICATE-----/h;$!d;x' | "${OPENSSL}" x509 -noout -issuer | head -n1 | _sed -e 's/.*[ /]CN ?= ?([^/,]*).*/\1/'
```

`openssl x509 -issuer` で、発行者の情報を表示し、最初の 1 行だけを取ります。

### 3. CN の部分だけを取り出す

```bash:line-numbers=1146
  <<<"${1}" _sed 'H;/-----BEGIN CERTIFICATE-----/h;$!d;x' | "${OPENSSL}" x509 -noout -issuer | head -n1 | _sed -e 's/.*[ /]CN ?= ?([^/,]*).*/\1/'
```

`CN=` の後ろの値だけを、正規表現で取り出して表示します。

## ここがすごい

- **必要な証明書だけを選ぶ**: 連鎖の中から、対象の 1 つだけに絞ってから読むので、結果がぶれません。
- **段階ごとに絞る**: 証明書の選択、情報の表示、名前の抽出、と 3 つの段階に分けられています。
- **既存の道具を組み合わせる**: 証明書を読むのは openssl、文字の処理は sed に任せています。

## まとめ

- 複数の項目が連なるデータは、対象の 1 つだけを先に選ぶと安定する。
- 情報の取り出しは、段階ごとに道具を分けると組み立てやすい。
- 証明書などの複雑な形式は、専門の道具の機能を使う。
