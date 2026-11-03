---
title: 16 進数の 1 文字ずつに「版」と「種類」の印を入れる UUID 生成
description: Lua の小さなユーティリティ集 lume の uuid。ひな形の文字列の x と y を、乱数の 16 進数 1 文字に置き換えるだけで、UUID version 4 の形を作ります。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [678, 685]
format: 2
function: lume.uuid
difficulty: 2
tags: [乱数, 文字列処理, ハック]
---

## ひとことで

`lume.uuid()` は、`550e8400-e29b-41d4-a716-446655440000` のような UUID（重複しにくい識別子）を 1 つ作って返す関数です。ひな形の文字列を用意し、`x` と `y` の場所だけを乱数で埋めることで、UUID version 4 の決まりを守った形を作ります。

## コード

```lua:line-numbers=678
function lume.uuid()
  local fn = function(x)
    local r = math.random(16) - 1
    r = (x == "x") and (r + 1) or (r % 4) + 9
    return ("0123456789abcdef"):sub(r, r)
  end
  return (("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"):gsub("[xy]", fn))
end
```

## 前提知識

- **UUID**: 128 ビットの識別子を、16 進数 32 桁とハイフンで表した文字列です。ハイフンで 8-4-4-4-12 の形に区切ります。
- **version 4 と variant**: UUID 規格では、3 番目のまとまりの先頭が必ず `4`（乱数から作った版）であり、4 番目のまとまりの先頭が `8`、`9`、`a`、`b` のどれかである必要があります。
- **`gsub` の関数呼び出し**: `string.gsub(文字列, パターン, 関数)` は、パターンに一致した部分を関数の戻り値で置き換えます。関数には一致した文字が渡されます。
- **`sub(r, r)`**: 文字列の `r` 番目の 1 文字を取り出します。Lua の文字列は 1 から数えます。

## 何をしているか

### 1. ひな形の文字を 1 つずつ置き換える

`"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"` は UUID の形のひな形です。`gsub("[xy]", fn)` で、`x` と `y` の 1 文字ずつを `fn` の戻り値に置き換えます。`4` はそのまま残るので、版の印は必ず 4 になります。

```lua:line-numbers=684
  return (("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"):gsub("[xy]", fn))
```

外側の `(...)` は、`gsub` が返す「置き換えた個数」を捨てて、文字列だけを返すための書き方です。

### 2. 乱数を 0〜15 の 1 桁にする

`math.random(16) - 1` で、0 から 15 の整数を 1 つ作ります。これは 16 進数の 1 桁に対応します。

```lua:line-numbers=680
    local r = math.random(16) - 1
```

### 3. `x` と `y` で範囲を変える

`x` は 0〜15 の全部を使います。`y` は `r % 4` で 0〜3 に絞ってから `+ 9` をするので、`9`〜`12` になります。`"0123456789abcdef"` の 9 番目から 12 番目は `8`、`9`、`a`、`b` です。

```lua:line-numbers=681
    r = (x == "x") and (r + 1) or (r % 4) + 9
```

最後に `sub(r, r)` で、その位置の 1 文字を返します。

```lua:line-numbers=682
    return ("0123456789abcdef"):sub(r, r)
```

`x` の番号を `r + 1` にしているのは、Lua の文字列が 1 から数えるためです。`0` 番目は存在しないので、ずらす必要があります。

## ここがすごい

- **規格の形を、ひな形だけで守る**: 版の `4` と、variant の `8`〜`b` を、ひな形と範囲の指定で直接書いています。乱数を作ってから後で直す方法より、ずれが起きにくくなります。
- **1 つの関数で両方を扱う**: `x` と `y` の違いは `fn` の中の条件だけです。`gsub` の関数呼び出しを使うと、ひな形の文字ごとに処理を変えられます。
- **`or` の使い方**: `(x == "x") and (r + 1) or (r % 4) + 9` は、三項演算子のない Lua で条件分岐を 1 行で書く定番の形です。`r + 1` が `0` や `false` になることはないので、`or` の落とし穴に当たりません。
- **注意点**: この乱数は `math.random` で作るので、暗号に使うには向いていません。また、Lua 5.1 では種（seed）を設定しないと起動のたびに同じ並びになるので、`math.randomseed` で種を決めておく必要があります。衝突しにくさは実用上十分ですが、セキュリティの用途では別の乱数源を使うべきです。

## まとめ

- UUID の形は、ひな形の文字列を用意して `gsub` で埋めると簡単に作れる。
- 規格で決まっている数字（版や variant）は、乱数の範囲を絞って固定する。
- Lua の文字列は 1 から数えるので、0 始まりの乱数は `+ 1` をして使う。
