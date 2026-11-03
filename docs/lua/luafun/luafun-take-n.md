---
title: 先頭から n 個だけ取り出す take_n
description: LuaJIT 向け関数型ライブラリ Lua Fun の take_n。イテレータから先頭 n 個の値だけを取り出す、新しいイテレータを作ります。n が負なら、エラーにします。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [376, 379]
format: 2
function: take_n
difficulty: 2
tags: [遅延評価, イテレータ, 防御的プログラミング]
---
## ひとことで

`take_n(n, gen, param, state)` は、イテレータの先頭から `n` 個の値だけを取り出す、新しいイテレータを作る関数です。元のイテレータは、必要な分しか進みません。無限に続く列からも、先頭だけを安全に取り出せます。

## コード

```lua:line-numbers=376
local take_n = function(n, gen, param, state)
    assert(n >= 0, "invalid first argument to take_n")
    return wrap(take_n_gen, {n, gen, param}, {0, state})
end
```

## 前提知識

- **無限のイテレータ**: 終わりのない列のことです。`cycle` や `rands` などが、このような列を作ります。これを全部回すことはできないので、先頭だけを取るための関数が必要です。
- **`assert`**: 条件が偽のときに、エラーを起こす関数です。引数の誤りを、早い段階で知らせるために使われます。
- **`wrap`**: 3 つ組のイテレータを、Lua Fun の扱う形にまとめる関数です。
- **状態の組 `{0, state}`**: 取り出した数と、元の状態を一緒に持つ表です。数が上限に達したかを、状態で覚えます。

## 何をしているか

### 1. 負の数を防ぐ

`n` が `0` より小さいなら、`assert` でエラーを起こします。取り出す数が負では、意味のある結果を作れないからです。

```lua:line-numbers=377
    assert(n >= 0, "invalid first argument to take_n")
```

### 2. 元の列を包んで、数を数えるイテレータにする

`wrap(take_n_gen, {n, gen, param}, {0, state})` は、元の `gen` と `param`、上限の `n`、そして数えるための `0` を組にして、新しいイテレータを作ります。実際の値は、呼ばれたときに `take_n_gen` が作ります。

```lua:line-numbers=378
    return wrap(take_n_gen, {n, gen, param}, {0, state})
```

## ここがすごい

- **無限の列に効く**: 値を先に全部作らないので、終わりのない列でも、先頭だけを安全に得られます。
- **数の管理を状態に持たせる**: 取り出した数を状態として保つので、関数の外に変数を持つ必要がありません。途中で止めて、再開することもできます。
- **引数の確認が早い**: 負の数を、作る前に弾きます。後で、奇妙な結果を調べるような手間を省けます。
- **注意点**: `n` が `0` のときは、何も取り出さない列になります。また、`n` は整数として扱われるので、小数を渡すと期待と違う数が出ることがあります。

## まとめ

- 無限の列の先頭だけを得るには、個数を状態として数えるイテレータで包むと安全である。
- 引数の誤りは、列を作る前に `assert` で弾くと、原因が分かりやすい。
- 遅延の列は、値を取り出すまで計算を進めないので、大きな処理も軽く書ける。
