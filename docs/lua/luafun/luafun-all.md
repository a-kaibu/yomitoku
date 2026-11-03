---
title: 一つでも外れたら止まる、all の早期終了
description: LuaJIT 向け関数型ライブラリ Lua Fun の all。イテレータの値を調べ、条件が false になった時点で止めます。全部が真のときだけ true を返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [668, 674]
format: 2
function: all
difficulty: 1
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`all(fun, gen, param, state)` は、イテレータのすべての値について条件 `fun` が真かを調べる関数です。途中で 1 つでも偽になれば、そこで止まって `false` を返します。値が 1 つもなければ、「すべて真」なので `true` を返します。

## コード

```lua:line-numbers=668
local all = function(fun, gen_x, param_x, state_x)
    local r
    repeat
        state_x, r = call_if_not_empty(fun, gen_x(param_x, state_x))
    until state_x == nil or not r
    return state_x == nil
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`（次を作る関数）、`param`（材料）、`state`（今の位置）の組です。
- **`repeat ... until`**: 条件が真になるまで繰り返す Lua の文法です。必ず 1 回は実行されます。
- **早期終了**: 答えが決まった時点で残りを調べずに止めることです。

## 何をしているか

### 1. 次の値で条件を調べる

`call_if_not_empty` は、値が残っていれば `fun` を値に当てて結果を返します。値が尽きていれば、`nil` を返します。

```lua:line-numbers=671
        state_x, r = call_if_not_empty(fun, gen_x(param_x, state_x))
```

### 2. 偽が出たら止める

`until state_x == nil or not r` は、値が尽きたか、条件が偽になったときに繰り返しを抜けます。偽が 1 つでも見つかれば、残りは調べません。

```lua:line-numbers=672
    until state_x == nil or not r
```

### 3. 最後に、尽きて止まったかを返す

`return state_x == nil` は、「値が尽きるまで全部真だった」ことを意味します。途中で止まった場合は `state_x` が `nil` ではないので、`false` になります。値が最初から無い場合も `true` です。


補足として、`all` は `any` の反対の形になっています。`any` は真が見つかれば止まり、`all` は偽が見つかれば止まります。どちらも同じ繰り返しの形を使い、止まる条件だけが逆になっています。この対応を覚えておくと、ほかの探索関数も同じ型で読めるようになります。

実際に呼ぶ例では、`fun.all(function(x) return x > 0 end, fun.range(1, 5))` が `true` を返し、`fun.all(function(x) return x < 3 end, fun.range(1, 5))` は、3 に当たった時点で止まって `false` を返します。

## ここがすごい

- **偽が見つかった時点で止まる**: 結論が決まった後の値は作られません。無限のイテレータでも、偽が出れば終わります。
- **終わり方と結果を 1 つの変数で表す**: 状態が `nil` かどうかだけで「尽きたか」を判定しています。結果を別に持つ必要がありません。
- **注意点**: 空のイテレータは `true` です。「空なら false」を期待すると、思わぬ結果になります。

## まとめ

- 全部が条件を満たすかを調べるときは、偽が見つかった時点で止めると速い。
- 空の集合は「すべて真」になる、という数学の決まりに合わせると、扱いが一貫する。
