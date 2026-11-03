---
title: 条件を満たす値だけを残す、filter の値の数による分け方
description: LuaJIT 向け関数型ライブラリ Lua Fun の filter。イテレータから条件を満たす値だけを取り出します。値が 1 つか複数かで、内部の処理を切り替えています。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [576, 578]
format: 2
function: filter
difficulty: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`filter(fun, gen, param, state)` は、イテレータの値のうち、条件 `fun` を満たすものだけを残すイテレータを作る関数です。`fun.filter(function(x) return x % 2 == 0 end, fun.range(10))` は、偶数だけを順に返します。条件に合わない値は、そっと飛ばされます。

## コード

```lua:line-numbers=576
local filter = function(fun, gen, param, state)
    return wrap(filter_gen, {fun, gen, param}, state)
end
```

内部で値の数に応じて処理を分ける `filter_detect` も、読むのに必要なので引用します。

```lua:line-numbers=563
local filter_detect = function(fun, gen_x, param_x, state_x, ...)
    if select('#', ...) < 2 then
        return filter1_gen(fun, gen_x, param_x, state_x, ...)
    else
        return filterm_gen(fun, gen_x, param_x, state_x, ...)
    end
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`、`param`、`state` の組です。`filter` は、この 3 つを包んで新しいイテレータにします。
- **可変長引数 `...`**: イテレータが 1 回に返す値の数です。1 つのときと、複数のときがあります。
- **`select('#', ...)`**: 可変長引数の個数を数えます。
- **`wrap`**: 3 つ組をライブラリのイテレータの形にまとめる関数です。

## 何をしているか

### 1. 包んだイテレータを作る

`filter` は、条件、元のイテレータ、材料、初期状態を `wrap` でまとめます。この時点では、まだ値は作られません。

```lua:line-numbers=577
    return wrap(filter_gen, {fun, gen, param}, state)
```

### 2. 値の数で処理を選ぶ

値が 1 つだけなら `filter1_gen`、複数なら `filterm_gen` を使います。`select('#', ...) < 2` で、2 つ未満かどうかを判定しています。

```lua:line-numbers=564
    if select('#', ...) < 2 then
```

### 3. 条件に合わなければ次へ進む

複数の値を扱う `filterm_gen` は、`fun(...)` が真なら値を返します。偽なら、`filterm_gen_shrink` を通して次の値へ進みます。


補足として、`filter` は `map` と組み合わせて使うことが多い関数です。先に条件で絞ってから値を変換すると、変換の回数を減らせます。順番を入れ替えても結果は同じになる場合が多いですが、条件の重さを考えて並べると速くなります。

## ここがすごい

- **値の数に応じた最適化**: 1 つの値の場合と、複数の値の場合を分けることで、それぞれに合った、短い処理を使えます。
- **条件に合わない値は作らない**: 偽の値は、外に返さず飛ばします。結果の列は、条件を満たすものだけになります。
- **注意点**: 条件が重い計算だと、飛ばされる値の分だけ時間がかかります。条件は軽く保つと、列全体が速く回ります。

## まとめ

- 条件で値を絞るには、包んだイテレータで必要な値だけを返すと、遅延評価のまま動く。
- 値の数が違う場合は、処理を分けると、それぞれを単純に書ける。
