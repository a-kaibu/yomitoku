---
title: 引数の数から、列の末尾を見分ける numargs
description: LuaJIT 向け関数型ライブラリ Lua Fun の numargs。可変長の引数の数を数えます。末尾が、列の三つ組の形になっていれば、その三つ組の分を数から除きます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [915, 926]
format: 2
function: numargs
difficulty: 3
tags: [イディオム, 型システム, 防御的プログラミング]
---
## ひとことで

`numargs(...)` は、可変長の引数の数を数える関数です。ただし、末尾に列の三つ組 `iterator`、`param`、`state` が並んでいると判断できる場合は、その三つを数から除きます。`zip` のように、列を引数で受ける関数が、列の数を正しく数えるための補助です。

## コード

:::: code-group

```lua:line-numbers=915 [日本語訳]
local numargs = function(...)
    local n = select('#', ...)
    if n >= 3 then
        -- 末尾の引数を確かめる
        local it = select(n - 2, ...)
        if type(it) == 'table' and getmetatable(it) == iterator_mt and
           it.param == select(n - 1, ...) and it.state == select(n, ...) then
            return n - 2
        end
    end
    return n
end
```

```lua:line-numbers=915 [原文]
local numargs = function(...)
    local n = select('#', ...)
    if n >= 3 then
        -- Fix last argument
        local it = select(n - 2, ...)
        if type(it) == 'table' and getmetatable(it) == iterator_mt and
           it.param == select(n - 1, ...) and it.state == select(n, ...) then
            return n - 2
        end
    end
    return n
end
```

::::

## 前提知識

- **可変長引数**: 関数に、いくつでも引数を渡せる書き方です。`select('#', ...)` で、引数の数を取れます。
- **`select(n, ...)`**: 可変長引数の `n` 番目を取り出す関数です。末尾の値を取り出すときに使います。
- **列の三つ組の印**: 列の表に付く metatable `iterator_mt`、材料、状態の三つが並んでいると、それは一つの列を表します。
- **`n - 2` の意味**: 三つのうち、先頭が列の表なので、その三つ分を一つの列として数えるための引き算です。

## 何をしているか

### 1. 引数の数が三つ以上なら、末尾を調べる

引数が三つ以上あるときだけ、末尾が列の三つ組になっているかを確かめます。二つ以下なら、そのまま数を返します。

```lua:line-numbers=916
    local n = select('#', ...)
    if n >= 3 then
```

### 2. 末尾の三つが列の形なら、三つ分を引く

三つ目の末尾の値 `it` が、列の表で、材料と状態が続く値と一致すれば、その三つは一つの列です。そのとき、数から `2` を引いて返します。

```lua:line-numbers=919
        local it = select(n - 2, ...)
        if type(it) == 'table' and getmetatable(it) == iterator_mt and
           it.param == select(n - 1, ...) and it.state == select(n, ...) then
            return n - 2
        end
```

### 3. 当てはまらなければ、そのままの数

どれにも当てはまらなければ、引数の数をそのまま返します。

```lua:line-numbers=925
    return n
```

## ここがすごい

- **列の引数を正しく数える**: 三つの引数を、一つの列として数え直せるので、関数の引数の意味が正しく伝わります。
- **確かめてから引く**: 列の表の metatable と、材料と状態の一致を、両方確かめます。たまたま三つ並んだ値を誤って扱わないようにしています。
- **とても短い**: 数える、確かめる、引く、の三つの流れを、短く書いています。
- **注意点**: 表の一致を確かめるのは、同じ列が続いている場合に限ります。別々の値が並ぶと、そのまま数えられます。

## まとめ

- 可変長の引数に、特別な形の値が混ざるときは、末尾の形を確かめてから数えると、意味を取り違えずに済む。
- 確かめの条件は、複数の要素を組み合わせると、誤認識を減らせる。
- 数を補正する関数は、呼ぶ側の期待する数と、実際の引数の数の違いを埋める役割を持つ。
