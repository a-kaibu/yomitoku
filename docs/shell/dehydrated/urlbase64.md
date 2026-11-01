---
title: "base64 を URL で安全に使える形に変えて、末尾の = を消す"
description: "base64 の + と / を - と _ に置き換え、末尾の = の詰め物を取り除く関数。証明書の署名などを URL に入れるときに必要な形式。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [923, 926]
function: "urlbase64"
difficulty: 2
format: 2
tags: [暗号, 文字列処理, ネットワーク]
---
## ひとことで

`urlbase64` は、データを **base64 の URL 安全な形式** に変換する関数です。標準入力のデータを base64 にしてから、`+` を `-`、`/` を `_` に置き換え、末尾の `=` を消します。

base64 の文字の中の `+` と `/` は、URL の中では特別な意味を持ちます。そのまま URL に入れると、正しく届かないことがあります。そこで、この 2 つを URL で安全な記号に置き換えています。

## コード

::: code-group

```bash:line-numbers=923 [日本語訳]
urlbase64() {
  # urlbase64: base64 の + を - に、/ を _ に置き換えた文字列
  "${OPENSSL}" base64 -e | tr -d '\n\r' | _sed -e 's:=*$::g' -e 'y:+/:-_:'
}
```

```bash:line-numbers=923 [原文]
urlbase64() {
  # urlbase64: base64 encoded string with '+' replaced with '-' and '/' replaced with '_'
  "${OPENSSL}" base64 -e | tr -d '\n\r' | _sed -e 's:=*$::g' -e 'y:+/:-_:'
}
```

:::

## 前提知識

- **base64**: バイナリのデータを、英数字と `+` `/` の文字だけで表す方法です。長さを 4 文字単位にそろえるために、末尾に `=` を付けることがあります。
- **`"${OPENSSL}"`**: openssl コマンドの場所を表す変数です。dehydrated は、この変数を通して openssl を呼びます。
- **`tr -d '\n\r'`**: 改行とキャリッジリターンを取り除きます。base64 の出力は、改行で折り返されることがあるためです。
- **`y:+/:-_:`**: sed の `y` 命令で、文字を 1 対 1 で置き換えます。`+` を `-` に、`/` を `_` に変えます。
- **`s:=*$::g`**: 行末の `=` を、すべて消します。

## 何をしているか

### 1. base64 にする

```bash:line-numbers=925
  "${OPENSSL}" base64 -e | tr -d '\n\r' | _sed -e 's:=*$::g' -e 'y:+/:-_:'
```

`openssl base64 -e` で標準入力を base64 にします。その出力から改行を消し、続いて `sed` で、末尾の `=` を消し、`+` と `/` を URL 安全な記号に置き換えます。

この 1 行に、変換の 3 つの手順がつながって書かれています。

## ここがすごい

- **パイプで段階的に変換する**: 変換の手順を、パイプで順番につないでいます。それぞれの段階が単純なので、読みやすい形になっています。
- **対になる関数がある**: 逆の変換は `deurlbase64` が担当します。作る側と読む側が、同じ規則で揃っています。
- **末尾の `=` を消す理由がある**: 長さの情報は、後で詰め物を補えば復元できます。URL に入れるときは、詰め物を省くのが一般的です。

## まとめ

- URL に入れる base64 は、`+` と `/` を別の記号に置き換える。
- 変換は、パイプでつないだ段階に分けると読みやすい。
- 逆の変換を用意しておくと、データの往復が安全になる。
