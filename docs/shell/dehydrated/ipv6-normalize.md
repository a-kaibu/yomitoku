---
title: "IPv6 のアドレスを、短く統一した形に直す"
description: "入力された IPv6 アドレスを、先頭の 0 を省き、連続した 0 を :: でまとめた標準的な形に直す。IPv4 はそのまま通す。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [281, 290]
function: "ipv6_normalize"
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, 正規表現]
---
## ひとことで

`ipv6_normalize` は、ドメイン名や IP アドレスの一覧を受け取り、**IPv6 のアドレスだけを標準的な短い形にそろえる** 関数です。IPv4 のアドレスや、IPv6 ではない名前は、変更せずそのまま通します。

IPv6 は同じアドレスを、さまざまな書き方で表せます。たとえば `2001:db8:0:0:0:0:0:1` と `2001:db8::1` は同じ意味です。比べたり、証明書に入れたりするときは、どちらかの形にそろえておく必要があります。

## コード

```bash:line-numbers=281
ipv6_normalize() {
  for domain in $(cat); do
    if [[ "${domain}" =~ : ]]; then
      printf "%s" "${domain}" | ipv6_expand | ipv6_shorten
    else
      printf "%s" "${domain}"
    fi
    printf " "
  done | sed -e 's/ $//'
}
```

## 前提知識

- **IPv6 の表記**: 16 進数の 4 桁の区間が 8 つ、コロンで区切られています。連続する 0 の区間は `::` で 1 回だけ省略できます。
- **`for 変数 in $(cat)`**: 標準入力の内容を空白で区切って、1 つずつ取り出して繰り返します。
- **`printf "%s" 値`**: 改行を付けずに値を出力します。
- **`sed -e 's/ $//'`**: 行末の 1 つの空白を取り除きます。
- **パイプでつなぐ**: `for ... done | sed` の形で、ループ全体の出力を `sed` に渡しています。

## 何をしているか

### 1. 1 つずつ判定する

```bash:line-numbers=282
  for domain in $(cat); do
    if [[ "${domain}" =~ : ]]; then
```

入力を空白で区切って 1 つずつ取り出し、コロンを含むかを調べます。コロンがあれば IPv6 です。

### 2. IPv6 なら展開してから短くする

```bash:line-numbers=284
      printf "%s" "${domain}" | ipv6_expand | ipv6_shorten
```

`ipv6_expand` で、省略された部分を補って全部の区間を 4 桁にそろえます。その後に `ipv6_shorten` で、先頭の 0 を省き、最も長い連続する 0 を `::` にまとめます。

### 3. それ以外はそのまま出す

```bash:line-numbers=286
      printf "%s" "${domain}"
    fi
    printf " "
```

IPv4 やドメイン名の場合は変更せず、後ろに空白を付けて出力します。

最後に `sed` で、行末の余分な空白を取り除きます。

## ここがすごい

- **展開してから縮める**: いきなり縮めると、連続する 0 の判断が難しくなります。いったん全部を同じ形に広げてから縮めるので、結果が必ず一定になります。
- **判定を 1 つだけにする**: IPv6 かどうかをコロンの有無で判定し、それ以外はすべて素通しにします。余計な検査をしないので、ドメイン名が混ざっていても壊れません。
- **役割を関数に分けている**: 展開（`ipv6_expand`）と縮約（`ipv6_shorten`）を別々の関数にしているので、それぞれを単独で読めます。

## まとめ

- 同じ値を比べるときは、表記をいったん統一する。
- 連続する 0 は `::` で省略できるが、展開と縮約の両方を正しく行う必要がある。
- 対象外の入力は素通しにすると、一覧の処理が安定する。
