---
title: "awk で正規表現に一致した部分だけを次々と取り出す"
description: "行の中から、パターンに一致する部分をすべて 1 つずつ表示する関数。grep -o のような動きを、awk の match と substr のループで実現している。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [103, 114]
function: "awk_egrep"
difficulty: 3
format: 2
tags: [正規表現, 文字列処理, ハック]
---
## ひとことで

`awk_egrep パターン` は、入力の各行から **パターンに一致する部分を、見つかった順にすべて 1 行ずつ** 表示する関数です。`grep -o` と同じ働きを、awk だけで行っています。

たとえば `awk_egrep '[0-9]+'` に `a1 b22 c333` を流すと、`1`、`22`、`333` の 3 行が出ます。`grep -o` が使えない環境でも動くように、dehydrated が自前で用意している部品です。

## コード

```bash:line-numbers=103
  awk_egrep () {
    local pattern_string=$1

    awk '{
      while ($0) {
        start=match($0, pattern);
        token=substr($0, start, RLENGTH);
        print token;
        $0=substr($0, start+RLENGTH);
      }
    }' pattern="$pattern_string"
  }
```

## 前提知識

- **`awk` の `match(文字列, 正規表現)`**: 文字列の中で正規表現に最初に一致する位置を返し、一致した長さを `RLENGTH` に入れます。一致しなければ 0 を返します。
- **`substr(文字列, 開始, 長さ)`**: 文字列の一部を取り出します。開始位置は 1 から数えます。
- **`while ($0)`**: 行が空でなくなるまで繰り返します。
- **`pattern="$pattern_string"`**: awk の外のシェルの値を、`-v` のような代入の形で渡しています。
- **`$0`**: awk が今読んでいる行全体です。

## 何をしているか

### 1. 一致する位置と長さを得る

```bash:line-numbers=108
        start=match($0, pattern);
        token=substr($0, start, RLENGTH);
```

`match` で最初の一致の位置 `start` を求め、その部分を `substr` で取り出して `token` に入れます。

### 2. 一致した部分を表示し、残りを処理する

```bash:line-numbers=110
        print token;
        $0=substr($0, start+RLENGTH);
```

取り出した部分を表示し、行の残り（一致した部分より後ろ）だけを `$0` に入れ直します。次の周回では、残りの中からまた一致を探します。

行に一致がなくなると、`match` は 0 を返します。このとき `substr` の結果が空になり、`$0` が空に近づいて、ループが終わります。

## ここがすごい

- **同じ部分を何度も探せる**: 一致した部分を取り除いた残りに対して、同じパターンを再び当てる、という単純な繰り返しで「すべての一致」を取り出せます。
- **外部ツールに頼らない**: `grep -o` は一般的ですが、古い環境や一部の BSD では使えないことがあります。awk は POSIX で規定されているため、より広く動きます。
- **パターンを引数にしている**: 関数に正規表現を渡すので、同じ関数を色々な場面で使い回せます。

## まとめ

- 一致した部分だけを取り出すには、`match` と `substr` の組み合わせが使える。
- 残りの文字列に対して繰り返すと、すべての一致を順に得られる。
- 標準的なツールがない環境では、awk で代用できることが多い。
