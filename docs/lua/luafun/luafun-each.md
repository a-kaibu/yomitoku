---
title: 列を最後まで回して、副作用を起こす each
description: LuaJIT 向け関数型ライブラリ Lua Fun の each。列の各値に関数を適用し、結果を捨てて、最後まで回します。画面への表示や、ファイルへの書き込みなど、副作用のための繰り返しに使います。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [182, 186]
format: 2
function: each
difficulty: 2
tags: [イテレータ, 関数型, 遅延評価]
---
## ひとことで

`each(fun, gen, param, state)` は、列の値を一つずつ関数 `fun` に渡して、最後まで回す関数です。`fun` の戻り値は使いません。表示、保存、通知など、結果ではなく動作そのものが目的の処理に使います。`for_each` と `foreach` という別名も用意されています。

## コード

```lua:line-numbers=182
local each = function(fun, gen, param, state)
    repeat
        state = call_if_not_empty(fun, gen(param, state))
    until state == nil
end
```

## 前提知識

- **副作用**: 関数の戻り値以外に、画面やファイルなどの外の世界に起きる変化のことです。`each` は、この副作用のために列を回します。
- **`repeat ... until`**: 条件が真になるまで、少なくとも一度は繰り返す文です。列が終わるまで回すのに向いています。
- **`call_if_not_empty`**: 値がなければ何もせず、値があれば `fun` を呼んで、次の状態を返す内部の関数です。
- **`map` との違い**: `map` は結果の列を作ります。`each` は結果を作らず、ただ回します。

## 何をしているか

### 1. 次の値があれば、関数を呼ぶ

`gen(param, state)` で次の状態と値を取り出し、値があれば `fun` に渡して呼びます。次の状態は、そのまま返されます。

```lua:line-numbers=184
        state = call_if_not_empty(fun, gen(param, state))
```

### 2. 列の終わりまで繰り返す

返された状態が `nil` になるまで、同じことを繰り返します。`nil` になったときが、列の終わりです。

```lua:line-numbers=183
    repeat
        state = call_if_not_empty(fun, gen(param, state))
    until state == nil
```

## ここがすごい

- **結果を作らない**: 結果の表を作らないので、メモリをほとんど使いません。大きな列を、そのまま表示したり保存したりできます。
- **列の形に従う**: 配列でも、遅延の列でも、同じ書き方で回せます。列の種類を気にしなくてよいです。
- **別名で読みやすく**: `for_each` や `foreach` など、慣れた名前でも呼べるようにしています。
- **注意点**: 列が無限だと、`each` は終わりません。必ず有限の列か、個数を決めた列に使ってください。

## まとめ

- 結果ではなく動作のために列を回すときは、結果を作らない `each` が向いている。
- 大きな列を扱うときは、結果の表を作らないことで、メモリを節約できる。
- 無限の列には使わないように、列の大きさを確かめておく。
