---
title: "配列を読むとき、要素をカンマで区切りながら 1 つずつ再帰的に解析する"
description: "JSON の配列を、トークンの列から読み取る関数。要素ごとに parse_value を呼び、区切りのカンマと終わりの ] を確かめる。bash の関数だけで組まれた小さな構文解析器の一部。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [152, 176]
function: "parse_array"
difficulty: 3
format: 2
tags: [パース, 再帰, 状態機械]
---
## ひとことで

`parse_array` は、JSON の配列 `[ ... ]` を読むための関数です。配列の中身を 1 つずつ読み、**値・カンマ・閉じ括弧** の順に並んでいるかを確かめます。

dehydrated は、JSON を一度に正規表現で読むのではなく、まず `tokenize` で **トークン**（記号や値の単位）に分けてから、この関数のような小さな関数で文法を読みます。その意味で、これは構文解析器（パーサー）の一部です。

## コード

```bash:line-numbers=152
  parse_array () {
    local index=0
    local ary=''
    read -r token
    case "$token" in
      ']') ;;
      *)
        while :
        do
          parse_value "$1" "$index"
          index=$((index+1))
          ary="$ary""$value"
          read -r token
          case "$token" in
            ']') break ;;
            ',') ary="$ary," ;;
            *) throw "EXPECTED , or ] GOT ${token:-EOF}" ;;
          esac
          read -r token
        done
        ;;
    esac
    value=$(printf '[%s]' "$ary") || value=
    :
  }
```

## 前提知識

- **トークン**: 文字列の中で意味を持つ最小の単位です。`[`、`,`、`"abc"` などが、それぞれ 1 つのトークンになります。
- **構文解析（パース）**: 並んだトークンが、文法どおりの形になっているかを調べることです。
- **`read -r token`**: 標準入力から 1 行を読み、`token` に入れます。ここではトークンが 1 行に 1 つずつ流れてくる前提です。
- **`value`**: `parse_value` が結果を入れる変数です。関数の間で値を受け渡すための仕組みとして使われています。
- **`throw`**: 構文の誤りを知らせる関数です。ここでは、期待した記号以外が来たときに呼ばれます。

## 何をしているか

### 1. 最初のトークンを読む

```bash:line-numbers=155
    read -r token
    case "$token" in
```

配列の開始の `[` の次のトークンを読みます。`]` なら、空の配列なので何もしません。

### 2. 要素を 1 つずつ読む

```bash:line-numbers=161
          parse_value "$1" "$index"
          index=$((index+1))
          ary="$ary""$value"
```

`parse_value` で要素を読み、その結果を `ary` に連結します。`index` は、何番目の要素かを数えるための変数です。

### 3. カンマか閉じ括弧を確かめる

```bash:line-numbers=164
          read -r token
          case "$token" in
            ']') break ;;
            ',') ary="$ary," ;;
            *) throw "EXPECTED , or ] GOT ${token:-EOF}" ;;
          esac
```

次のトークンが `]` なら配列の終わりなので、ループを抜けます。`,` なら区切りとして `ary` に追加します。それ以外は、構文の誤りとして `throw` で報告します。

### 4. 結果を組み立てる

```bash:line-numbers=174
    value=$(printf '[%s]' "$ary") || value=
```

`ary` を `printf` で `[...]` の形にして、`value` に入れます。

## ここがすごい

- **文法をそのまま書いている**: 「値があり、カンマで続き、最後に `]`」という JSON の文法を、`case` の分岐として直接書いています。
- **誤りを早く見つける**: 期待する記号以外が来た時点で、すぐ報告します。途中の値を壊したまま進むことがありません。
- **値の受け渡しを変数で行う**: bash の関数は値を返せないため、結果を `value` という変数に入れる方法を取っています。小さなシェルの中で、構文解析器を組み立てる工夫です。

## まとめ

- 構文の読み取りは、「期待する記号」を一つずつ確かめる形にすると分かりやすい。
- bash では、関数の結果を変数で渡すのが定番の方法。
- 誤りはその場で報告すると、原因の特定が早い。
