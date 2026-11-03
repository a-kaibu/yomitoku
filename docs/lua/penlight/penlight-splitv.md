---
title: 文字列を区切って、値を複数の戻り値で返す splitv
description: Lua のユーティリティ集 Penlight の utils.splitv。文字列を区切りで分け、その結果を一つの表ではなく、複数の戻り値として返します。split の結果を、そのまま変数に受け取れます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [745, 747]
format: 2
function: utils.splitv
difficulty: 1
tags: [文字列処理, イディオム, 標準ライブラリ]
---
## ひとことで

`utils.splitv(s, re, plain, n)` は、文字列 `s` を区切りで分けて、その結果を複数の戻り値として返す関数です。`utils.split` は分けた結果を一つの表にしますが、`splitv` は表を作らずに、値を直接受け取れる形にします。`local a, b = splitv("x y", " ")` のように書けるのが利点です。

## コード

```lua:line-numbers=745
function utils.splitv (s,re, plain, n)
    return _unpack(utils.split(s,re, plain, n))
end
```

## 前提知識

- **`utils.split`**: 文字列を区切りで分けて、表として返す Penlight の関数です。`splitv` は、この関数の結果を利用しています。
- **可変長の戻り値**: 表の要素を、複数の戻り値として展開できます。`_unpack` は、その展開を行う関数です。
- **区切りのパターン**: `re` は、区切りを表す文字列です。`plain` が真なら、パターンとしてではなく、そのままの文字として扱われます。
- **`n` の意味**: 分ける最大の数を表します。省略すると、区切れるだけ分けます。

## 何をしているか

### 1. 文字列を表に分ける

`utils.split(s, re, plain, n)` で、文字列を区切りごとに分けた表を作ります。引数は、そのまま `split` へ渡されます。

### 2. 表を複数の戻り値に展開する

`_unpack` で、分けた表の要素を、一つずつ戻り値として返します。呼ぶ側は、受け取る変数の数だけ、値を使えます。

```lua:line-numbers=746
    return _unpack(utils.split(s,re, plain, n))
```

## ここがすごい

- **変数に直接受け取れる**: 表を作って取り出す手間が要りません。`local a, b = utils.splitv(...)` で、必要な部分を一行で受け取れます。
- **分けるロジックは一か所**: 区切りの処理は、`split` に任せています。`splitv` は、戻り値の形を変えるだけなので、二つの関数の動きが食い違いません。
- **引数はそのまま渡す**: 区切りや `plain` の指定を、同じ形で受け付けます。`split` を知っていれば、そのまま使えます。
- **注意点**: 分けた数が多いと、戻り値が多くなりすぎて、Lua の上限に当たることがあります。大量の区切りには、表のままの `split` を使ってください。

## まとめ

- 少数の値を分けて受け取るときは、表を作らずに戻り値で返すと、書き方が簡単になる。
- 同じ処理を二つの形で提供するときは、中身を一つにして、戻り値の形だけ変えると安全である。
- 大量の値は、戻り値の上限を意識して、表のまま扱う。
