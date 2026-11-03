---
title: 一つの値を何度も繰り返す duplicate
description: LuaJIT 向け関数型ライブラリ Lua Fun の duplicate。与えた値を無限に繰り返すイテレータを作ります。複数の値を渡した場合は、その並びを繰り返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [253, 259]
format: 2
function: duplicate
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`duplicate(...)` は、渡された値を無限に繰り返すイテレータを作る関数です。値が一つなら、その値が何度も出てきます。複数の値を渡すと、その並びを先頭から何度も繰り返します。区切りの記号や、既定の値を並べるときに使えます。

## コード

```lua:line-numbers=253
local duplicate = function(...)
    if select('#', ...) <= 1 then
        return wrap(duplicate_gen, select(1, ...), 0)
    else
        return wrap(duplicate_table_gen, {...}, 0)
    end
end
```

## 前提知識

- **可変長引数 `...`**: 関数に、いくつでも引数を渡せる書き方です。`select("#", ...)` で、引数の数を調べられます。
- **`select(1, ...)`**: 可変長引数の先頭の値を取り出します。値が一つのときは、この値を使います。
- **`{...}`**: 可変長引数を、そのまま表にまとめる書き方です。複数の値を一つの繰り返しの材料として持ちます。
- **`wrap`**: 3 つ組のイテレータを、Lua Fun の扱う形にまとめる関数です。

## 何をしているか

### 1. 引数の数で、扱いを分ける

`select('#', ...)` で引数の数を調べます。一つ以下なら、その値を一つだけ使う形にします。二つ以上なら、すべてを表にまとめます。

```lua:line-numbers=254
    if select('#', ...) <= 1 then
        return wrap(duplicate_gen, select(1, ...), 0)
    else
        return wrap(duplicate_table_gen, {...}, 0)
    end
```

### 2. 値か表を、繰り返しのイテレータにする

一つの値なら `duplicate_gen`、表なら `duplicate_table_gen` を使い、数え始めの `0` と組にします。どちらも、呼ばれるたびに同じ値を返す列になります。

```lua:line-numbers=255
        return wrap(duplicate_gen, select(1, ...), 0)
    else
        return wrap(duplicate_table_gen, {...}, 0)
```

## ここがすごい

- **一つの名前で二つの形**: 値一つの繰り返しと、並びの繰り返しを、同じ関数で扱えます。呼ぶ側は、引数を並べるだけでよいです。
- **表に変換するのは必要なときだけ**: 値が一つのときは表を作りません。無駄なメモリを使わずに済みます。
- **無限の列**: 繰り返しは終わりません。`take_n` などで、必要な個数だけを取り出して使います。
- **注意点**: 表を渡した場合、その表の中身が後から変わると、繰り返しの結果も変わります。元の表を書き換えない運用が安全です。

## まとめ

- 引数の数で扱いを分けると、一つの関数で、値と並びの両方を繰り返せる。
- 値が一つの場合は、余計な表を作らずに済ませると、無駄を減らせる。
- 無限の列は、個数を指定して取り出す関数と組み合わせると、安全に使える。
