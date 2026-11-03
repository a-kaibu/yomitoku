---
title: 値を一つ遅らせて足す、sum の書き方
description: LuaJIT 向け関数型ライブラリ Lua Fun の sum。前の回で取り出した値を次の回で足すという 1 回ずれの仕組みで、終わりを判定する前に最後の値を取りこぼさずに合計します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [692, 700]
format: 2
function: sum
difficulty: 2
tags: [イテレータ, 数値計算, 遅延評価]
---

## ひとことで

`sum(gen, param, state)` は、イテレータが返すすべての数字を足し合わせる関数です。`fun.sum(fun.range(4))` は `10` になります。`sum` は、値を取り出す処理と足す処理の順番を工夫して、最後の値を取りこぼさないように書かれています。

## コード

```lua:line-numbers=692
local sum = function(gen, param, state)
    local s = 0
    local r = 0
    repeat
        s = s + r
        state, r = gen(param, state)
    until state == nil
    return s
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`、`param`、`state` の組です。`gen(param, state)` を呼ぶと、次の状態と値が返ります。
- **`repeat ... until`**: 条件を満たすまで繰り返す文法です。
- **状態と値の区別**: `state` は「次へ進むための印」で、`r` は「今取れた値」です。`state` が `nil` になると、値は存在しません。

## 何をしているか

### 1. 直前に取った値を足す

最初の `r` は `0` です。毎回の繰り返しでは、まず前回取った値 `r` を `s` に足し、それから次の値を取ります。

```lua:line-numbers=696
        s = s + r
```

### 2. 次の値を取る

`gen(param, state)` は、次の状態と値を `state` と `r` に入れます。`state` が `nil` になれば、値はもう無いので繰り返しを抜けます。

```lua:line-numbers=697
        state, r = gen(param, state)
```

### 3. 最後の値がどう扱われるか

値 `v` を取った回では、`state` は `nil` ではありません。その次の回で `s = s + v` が実行されてから、新しい値を取りに行きます。そこで `state` が `nil` になるので、最後の値も必ず足されています。


補足として、`sum` は数字の列を前提にしているので、`product` や `max` のような別の集計も同じ型で書けます。違うのは、初期値と足し算の部分だけです。

## ここがすごい

- **終わりの判定が 1 か所だけ**: 「値を足す」と「次を取る」を 1 つのループにまとめ、終わりの判定は `until` だけに任せています。
- **1 回ずれる設計の利点**: 取った値をすぐ足すと、終わりの値が `nil` の回に混ざるかどうかを別に考える必要があります。足す場所をずらすことで、この分岐を消しています。
- **注意点**: 値が `nil` を含むと、足し算でエラーになります。数字だけを流すイテレータに使ってください。

## まとめ

- 「取った値を足す」と「次を取る」の順番を決めると、終わりの処理が単純になる。
- 1 回ずらして足す書き方は、最後の値の取りこぼしを防ぐのに役立つ。
