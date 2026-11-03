---
title: 比較の関数で、最も小さい値を一つ選ぶ min_by
description: LuaJIT 向け関数型ライブラリ Lua Fun の min_by。渡された比較関数を使って、列の中の最小の値を選びます。比べ方を利用者が決められる点が特徴です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [748, 758]
format: 2
function: min_by
difficulty: 2
tags: [関数型, 探索, イテレータ]
---
## ひとことで

`min_by(cmp, gen, param, state)` は、列の中から、比較関数 `cmp` で最も小さいとされる値を一つ選ぶ関数です。`cmp(m, r)` が、現在の候補 `m` と新しい値 `r` のうち、どちらを残すかを決めます。数だけでなく、表や文字列など、どんな値でも比べ方を決められます。

## コード

```lua:line-numbers=748
local min_by = function(cmp, gen_x, param_x, state_x)
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("min: iterator is empty")
    end

    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
    return m
end
```

## 前提知識

- **比較関数 `cmp`**: 二つの値を受け取り、残すべき値を返す関数です。この `min_by` では、`cmp(m, r)` の戻り値を、次の候補として使います。
- **`min` との違い**: `min` は、比較の方法が数の大小に決まっています。`min_by` は、比べ方を呼ぶ側が決められます。
- **最初の値を候補にする**: 列の先頭の値を、最初の候補 `m` にします。それから残りの値と比べていきます。
- **空の列**: 最初の値がない列では、比べる相手がいないので、エラーにします。

## 何をしているか

### 1. 先頭の値を、最初の候補にする

`gen_x(param_x, state_x)` で、列の先頭の値 `m` を取り出します。列が空なら、`error` でエラーにします。

```lua:line-numbers=749
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("min: iterator is empty")
    end
```

### 2. 残りの値を、比較関数で比べる

`for` で残りの値を一つずつ取り出し、`cmp(m, r)` の戻り値を新しい候補 `m` にします。これを列の終わりまで続けます。

```lua:line-numbers=754
    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
```

### 3. 最後に残った候補を返す

すべての値を比べ終えたら、残った `m` を返します。これが、比較の規則で最も小さいとされた値です。

```lua:line-numbers=757
    return m
```

## ここがすごい

- **比べ方を外から決められる**: 文字列の長さで比べたり、特定の鍵の値で比べたりと、用途に応じた比較ができます。
- **繰り返しは一回だけ**: 列を一度回すだけで、最小の値が決まります。大きな列でも、余分な比較は増えません。
- **比較関数が一か所に**: 比べる規則を関数に任せているので、`min_by` 自体は、どんな規則でも同じ形で書けます。
- **注意点**: `cmp` が一貫しない比べ方をすると、結果が思わぬ値になることがあります。また、空の列ではエラーになるので、呼ぶ前に確かめてください。

## まとめ

- 最小値を選ぶ処理は、比べ方を関数として渡すと、どんな値にも使える。
- 候補を一つ持ちながら一度だけ回すと、余分な処理を増やさずに答えを得られる。
- 空の列の扱いを決めておくと、呼ぶ側が安心して使える。
