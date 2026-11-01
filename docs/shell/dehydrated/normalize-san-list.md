---
title: "ドメイン名の一覧を、小文字にそろえて重複を除く"
description: "標準入力から受け取ったドメイン名の一覧を、小文字にし、前後の空白と重複を取り除いて、1 行の空白区切りにする関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1850, 1852]
function: "normalize_san_list"
difficulty: 2
format: 2
tags: [文字列処理, イディオム, CLI]
---
## ひとことで

`normalize_san_list` は、**証明書に入れるドメイン名の一覧を、比べやすい形に整える** 関数です。小文字にそろえ、同じ名前は 1 つにまとめます。

証明書の SAN（代わりの名前）の一覧は、設定ファイルの書き方によって揺れます。大文字が混ざったり、同じ名前が重なったりします。その状態のままでは、変更を正しく判断できません。

## コード

```bash:line-numbers=1850
normalize_san_list() {
  cat | awk '{print tolower($0)}' | _sed 's/ $//' | _sed 's/^ //' | ipv6_normalize | tr ' ' '\n' | sort -u | tr '\n' ' ' | _sed 's/ $//'
}
```

## 前提知識

- **SAN（Subject Alternative Name）**: 証明書が対象とする、複数のドメイン名を並べた欄です。
- **`tolower`**: 文字を小文字にする awk の関数です。
- **`sort -u`**: 並べ替えと同時に、重複を 1 つにまとめるコマンドです。
- **`ipv6_normalize`**: 同じファイル内で定義された、IPv6 の表記を揃える関数です。
- **`tr ' ' '\n'`**: 空白を改行に変えて、1 行ずつの並びにします。

## 何をしているか

### 1. 小文字にして空白を整える

```bash:line-numbers=1851
  cat | awk '{print tolower($0)}' | _sed 's/ $//' | _sed 's/^ //' | ipv6_normalize | tr ' ' '\n' | sort -u | tr '\n' ' ' | _sed 's/ $//'
```

各行を小文字にし、前後の空白を取り除きます。

### 2. IPv6 の表記を揃える

```bash:line-numbers=1851
  cat | awk '{print tolower($0)}' | _sed 's/ $//' | _sed 's/^ //' | ipv6_normalize | tr ' ' '\n' | sort -u | tr '\n' ' ' | _sed 's/ $//'
```

IPv6 のアドレスを、同じ形の表記に直します。

### 3. 並べ替えて重複を除く

```bash:line-numbers=1851
  cat | awk '{print tolower($0)}' | _sed 's/ $//' | _sed 's/^ //' | ipv6_normalize | tr ' ' '\n' | sort -u | tr '\n' ' ' | _sed 's/ $//'
```

空白を改行に変えて並べ、`sort -u` で重複を 1 つにまとめます。最後に、空白区切りの 1 行に戻します。

## ここがすごい

- **比較の前に揃える**: 大文字や重複の揺れを先に消すので、一覧の比較が正しくできます。
- **既存の関数を再利用する**: IPv6 の正規化は、別の関数に任せています。役割の分担がはっきりします。
- **並べ替えで順番も揃う**: 重複の除去と同時に並べ替えるので、出力が毎回同じ順番になります。

## まとめ

- 一覧の比較は、大文字小文字と重複を先に揃えると正確になる。
- 専門の変換は、既存の関数に任せると重複が減る。
- 並べ替えを入れると、出力が毎回同じになり差分が見やすい。
