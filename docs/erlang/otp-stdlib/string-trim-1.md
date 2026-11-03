---
title: "文字列の前と後ろの空白を、Unicode の空白の定義で取り除く"
description: "string:trim/1 は、文字列の両端にある空白を取り除く。空白の判定に、Unicode の pattern whitespace を使うので、全角の空白や改行も含まれる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [481, 482]
function: "string:trim/1"
difficulty: 1
format: 2
tags: ["文字列処理", "Unicode", "標準ライブラリ"]
---
## ひとことで

`string:trim/1` は、文字列の前と後ろにある空白を取り除きます。
空白の範囲は、Unicode で「パターンの空白」として定められた文字の集まりを使います。

## コード

```erlang:line-numbers=481
trim(Str) ->
    trim(Str, both, unicode_util:pattern_whitespace()).
```

## 前提知識

- **空白の文字**: 半角のスペースや、タブ、改行などです。Unicode には、ほかにも空白として扱われる文字があります。
- **`unicode_util:pattern_whitespace/0`**: Unicode の pattern whitespace の文字集合を返す関数です。
- **`trim/3`**: 文字列の両端のどちら側を取り除くかを、引数で選べる関数です。`trim/1` は、両側を指定しています。
- **`both`**: 両端を取り除くことを表す値です。`leading` と `trailing` の組み合わせに当たります。

## 何をしているか

### 1. 両端を指定して、`trim/3` に任せる

```erlang:line-numbers=481
trim(Str) ->
    trim(Str, both, unicode_util:pattern_whitespace()).
```

`trim/1` は、本体が一行だけです。取り除く側を `both` にし、空白の集合を `unicode_util:pattern_whitespace/0` で用意します。
その二つを `trim/3` に渡して、実際の処理を任せています。

## ここがすごい

### 空白の定義を、Unicode に任せる

どの文字を空白とみなすかを、Erlang の中で一覧にしていません。
`pattern_whitespace` は、Unicode の規則に基づく集合です。全角の空白や、特殊な改行の文字も、同じ基準で扱われます。

### 三つの引数を、一つの関数名で隠す

`trim/3` は、取り除く側と、取り除く文字の集合を、引数で受け取ります。
`trim/1` は、よくある組み合わせを一つの名前にまとめた関数です。呼び出し側は、三つの引数を覚えなくても使えます。

### 本体の一行で、役割が分かれる

`trim/1` は、「何を空白とみなすか」と「どちら側か」の二つを決めて、処理を別の関数に渡します。
読み手は、一行を読むだけで、全体の意図が分かります。

### 戻り値は、残った文字列の形を保つ

`trim/1` が返すのは、取り除いた後の文字列です。入力がリストならばリストを、バイナリならばバイナリを返します。
空白だけの文字列を渡すと、結果は空の文字列になります。取り除く処理で、例外が起きることはありません。

### 空白の判定を、一箇所で変えられる

空白の集合を `trim/3` に渡す形なので、別の集合を使いたいときも、同じ関数を使い回せます。
`trim/1` は、よく使う組み合わせだけを用意しています。細かい指定が必要なときは、`trim/3` を直接呼びます。

## まとめ

`string:trim("  hello  ")` は、`"hello"` を返します。
`string:trim("\t あいう \n")` のように、全角の空白や改行があっても、両端のものが取り除かれます。
