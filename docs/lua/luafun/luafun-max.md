---
title: 数なら数学の max、それ以外は比べて最大を選ぶ max
description: LuaJIT 向け関数型ライブラリ Lua Fun の max。列の最大値を返します。最初の値が数なら、速い数学の関数を使い、それ以外は大小の比べ方で選びます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [764, 782]
format: 2
function: max
difficulty: 2
tags: [数値計算, 最適化, 関数型]
---
## ひとことで

`max(gen, param, state)` は、列の中の最大の値を返す関数です。最初の値が数なら、速く動く `math.max` を比べに使います。数でなければ、`>` で比べられる値として、大きい方を残します。空の列ではエラーになります。

## コード

:::: code-group

```lua:line-numbers=764 [日本語訳]
local max = function(gen_x, param_x, state_x)
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("max: iterator is empty")
    end

    local cmp
    if type(m) == "number" then
        -- 数なら math.max を使う最適化
        cmp = math.max
    else
        cmp = max_cmp
    end

    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
    return m
end
```

```lua:line-numbers=764 [原文]
local max = function(gen_x, param_x, state_x)
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("max: iterator is empty")
    end

    local cmp
    if type(m) == "number" then
        -- An optimization: use math.max for numbers
        cmp = math.max
    else
        cmp = max_cmp
    end

    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
    return m
end
```

::::

## 前提知識

- **`math.max`**: 二つの数のうち大きい方を返す標準関数です。数に対して速く動きます。
- **`max_cmp`**: 二つの値を比べて、大きい方を返す内部の関数です。数以外の値にも使えます。
- **比べ方の選択**: 最初の値の型で、比べ方を一度だけ決めます。途中で型を調べ直さないので、速く動きます。
- **`min` との対**: `min` は、最小の値を選ぶ関数です。同じ構造で、比べ方だけが異なります。

## 何をしているか

### 1. 先頭の値と、比べ方を決める

列から最初の値を取り出し、候補 `m` にします。`m` が数なら `math.max`、そうでなければ `max_cmp` を比べ方に選びます。

```lua:line-numbers=765
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("max: iterator is empty")
    end
```

```lua:line-numbers=770
    local cmp
    if type(m) == "number" then
        -- An optimization: use math.max for numbers
        cmp = math.max
    else
        cmp = max_cmp
    end
```

### 2. 残りの値を比べて、最大を更新する

残りの値を一つずつ取り出し、比べ方で候補と比べます。大きい方を新しい候補にします。

```lua:line-numbers=778
    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
```

### 3. 最大の値を返す

列を回し終えたら、候補 `m` を返します。

```lua:line-numbers=781
    return m
```

## ここがすごい

- **型で速さを選ぶ**: 数なら専用の関数を、それ以外なら一般の比べ方を使います。同じ関数で、速さと汎用性を両立しています。
- **比べ方は一度だけ決まる**: 最初の値で比べ方を決めるので、途中で型を調べる無駄がありません。
- **列を一度だけ回す**: 候補を一つ持ちながら進むので、表を作らずに最大を見つけられます。
- **注意点**: 途中に数と数以外が混ざると、比べ方が合わなくなります。列の値の型は、そろえて使ってください。

## まとめ

- 型による速さの選択は、最初の値で一度だけ決めると、無駄な判定を省ける。
- 最大と最小のような対の関数は、同じ構造で書くと、理解がしやすい。
- 列の値の型は、途中で混ざらないように揃えておく。
