---
title: 16 進数と rgba の色の文字を 0 から 1 の値に直す
description: Lua の小さなユーティリティ集 lume の color。16 進数の色の文字列と rgba の書き方を読み、赤・緑・青・透明度を 0 から 1 の小数にそろえて返します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [737, 756]
format: 2
function: lume.color
difficulty: 2
tags: [文字列処理, 正規表現, 数値計算]
---

## ひとことで

`lume.color(str, mul)` は、`"#ff8800"` や `"rgba(255, 136, 0, 0.5)"` のような色の文字列を読んで、赤・緑・青・透明度の 4 つの数字に変える関数です。どの値も `0` から `1` の小数になります。ゲームや描画で、色を計算に使える形にするときに役立ちます。

## コード

```lua:line-numbers=737
function lume.color(str, mul)
  mul = mul or 1
  local r, g, b, a
  r, g, b = str:match("#(%x%x)(%x%x)(%x%x)")
  if r then
    r = tonumber(r, 16) / 0xff
    g = tonumber(g, 16) / 0xff
    b = tonumber(b, 16) / 0xff
    a = 1
  elseif str:match("rgba?%s*%([%d%s%.,]+%)") then
    local f = str:gmatch("[%d.]+")
    r = (f() or 0) / 0xff
    g = (f() or 0) / 0xff
    b = (f() or 0) / 0xff
    a = f() or 1
  else
    error(("bad color string '%s'"):format(str))
  end
  return r * mul, g * mul, b * mul, a * mul
end
```

## 前提知識

- **16 進数**: 0 から 9 と a から f で数を表す方法です。`ff` は 255、`00` は 0 です。色の `#ff8800` は、2 桁ずつ赤・緑・青を表します。
- **`%x`**: 16 進数の 1 文字を表すパターンです。
- **`tonumber(s, 16)`**: 文字列を 16 進数として数に直します。`tonumber("ff", 16)` は `255` です。
- **`gmatch`**: パターンに一致する部分を、順に取り出すイテレータを返します。`f()` のように呼ぶと、次の数字が出てきます。
- **`0xff`**: 16 進数の `ff`、つまり 255 を Lua で書いた表記です。

## 何をしているか

### 1. `#` で始まる 16 進数の色を読む

`#(%x%x)(%x%x)(%x%x)` は、`#` に続く 6 桁の 16 進数を、2 桁ずつ 3 つに分けて取り出します。取れたら、それぞれを `tonumber(…, 16)` で数にして、`0xff` で割ります。これで `0` から `1` の値になります。

```lua:line-numbers=740
  r, g, b = str:match("#(%x%x)(%x%x)(%x%x)")
```

```lua:line-numbers=742
    r = tonumber(r, 16) / 0xff
```

16 進数の色には透明度がないので、`a = 1`（完全に不透明）とします。

### 2. `rgba(...)` の書き方を読む

`rgba?%s*%(` は、`rgb(` または `rgba(` で始まる書き方を表します。`?` が「直前の `a` があってもなくてもよい」という意味です。中の数字は `gmatch("[%d.]+")` で、順番に取り出します。

```lua:line-numbers=746
  elseif str:match("rgba?%s*%([%d%s%.,]+%)") then
```

```lua:line-numbers=748
    r = (f() or 0) / 0xff
```

赤・緑・青は `0xff` で割って `0` から `1` に直します。透明度は、数字があればそのまま、なければ `1` を使います。

### 3. 対応していない形はエラーにする

どちらにも当てはまらなければ、`error` で、受け取った文字列を示して止めます。

## ここがすごい

- **同じ結果の形にそろえる**: 16 進数でも `rgba(...)` でも、最後は同じ 4 つの値を返します。使う側は書き方の違いを気にしなくて済みます。
- **`0xff` で割るだけで正規化**: 255 で割るという 1 つの操作で、0 から 1 の範囲になります。この形にしておくと、掛け算で明るさを調整しやすくなります。
- **`mul` で一括調整**: 最後に `mul` を掛けるので、明るさを 1 回の引数で変えられます。
- **注意点**: `rgba(...)` の透明度を `0` から `1` で書いた場合も、この関数は `/ 0xff` をしていないので、そのまま `0.5` などが返ります。書き方によって、透明度の扱いが違う点に注意が要ります。

## まとめ

- 色の文字列は、パターンで部品に分けて数に直すと、書き方が違っても同じ形で扱える。
- 0 から 1 にそろえておくと、計算や調整がしやすくなる。
- 対応していない書き方は、エラーで早めに知らせる。
