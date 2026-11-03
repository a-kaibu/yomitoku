---
title: イテレータの値を、そのまま配列に集める totable
description: LuaJIT 向け関数型ライブラリ Lua Fun の totable。イテレータの値を 1 つずつ取り出して、配列に順番どおり入れます。尽きたら止まる、遅延評価の結果を実体にする操作です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [804, 814]
format: 2
function: totable
difficulty: 1
tags: [イテレータ, データ構造, 遅延評価]
---

## ひとことで

`totable(gen, param, state)` は、遅延評価で作られる値の列を、ふつうの配列（テーブル）に変える関数です。`fun.range(3):totable()` は `{1, 2, 3}` になります。値は作られる順に並ぶので、順番は保たれます。

## コード

```lua:line-numbers=804
local totable = function(gen_x, param_x, state_x)
    local tab, val = {}
    while true do
        state_x, val = gen_x(param_x, state_x)
        if state_x == nil then
            break
        end
        table.insert(tab, val)
    end
    return tab
end
```

## 前提知識

- **遅延評価**: 値を必要になるまで作らない方式です。イテレータはその代表です。
- **`table.insert`**: 配列の末尾に値を追加する標準関数です。
- **`while true` と `break`**: 終わりの条件を中で判定して、ループを抜ける書き方です。

## 何をしているか

### 1. 空の配列を用意する

`tab` は、結果を入れる空の配列です。

### 2. 値を取って、尽きるまで入れる

`gen_x` で次の状態と値を取り出します。状態が `nil` なら終わりなので `break` します。値があれば `table.insert` で末尾に入れます。

```lua:line-numbers=807
        state_x, val = gen_x(param_x, state_x)
```

```lua:line-numbers=811
        table.insert(tab, val)
```

### 3. 集めた配列を返す

ループが終わったら、集まった配列 `tab` を返します。


補足として、`totable` は値を配列の 1 番目から順に入れるので、`ipairs` と同じ順番で読めます。ただし、途中で値が `nil` になると、その位置の扱いは `table.insert` の仕様に従います。値が `nil` を含む列では、番号ごとに別の方法で集めることを検討してください。


また、`totable` は値を集めるだけで、途中の加工はしません。加工が必要なら、先に `map` や `filter` で変換してから `totable` を呼ぶと、同じ流れで書けます。集める処理と加工の処理を分けると、それぞれの動きを単独で確かめやすくなります。


さらに、`totable` の結果はふつうの配列なので、`table.concat` や `ipairs` など、標準の道具でそのまま扱えます。遅延評価の列を一度「普通のデータ」に戻すことで、ほかのコードと受け渡しやすくなる、というのがこの関数の役割です。

## ここがすごい

- **終わりの判定が明確**: 状態が `nil` になった時点で止まるので、値が `nil` を含んでいても、尽きたかどうかを状態で正しく判定できます。
- **無限のイテレータでは止まらない**: 値を全部集める関数なので、無限の列に使うと終わりません。使う前に、列が有限かを確かめてください。
- **注意点**: 値が `nil` の場合、配列には入りますが、`#tab` で数えると正しく数えられないことがあります。

## まとめ

- 遅延評価の結果を実体の配列にするには、尽きるまで取り出して入れる形になる。
- 有限の列かどうかを、必ず使う前に確かめる。
