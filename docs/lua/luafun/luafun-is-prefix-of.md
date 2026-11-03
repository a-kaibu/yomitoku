---
title: 一方が他方の先頭になっているかを調べる is_prefix_of
description: LuaJIT 向け関数型ライブラリ Lua Fun の is_prefix_of。二つのイテレータを一緒に回し、片方の値がすべて、もう片方の先頭と一致するかを調べます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [649, 664]
format: 2
function: is_prefix_of
difficulty: 3
tags: [イテレータ, 探索, 関数型]
---
## ひとことで

`is_prefix_of(iter_x, iter_y)` は、列 `iter_x` が、列 `iter_y` の先頭部分と一致するかを調べる関数です。二つの列を同時に一つずつ回し、`iter_x` の値がなくなるまで、値が食い違わないかを見ます。一致すれば `true`、途中で違えば `false` を返します。

## コード

```lua:line-numbers=649
local is_prefix_of = function(iter_x, iter_y)
    local gen_x, param_x, state_x = iter(iter_x)
    local gen_y, param_y, state_y = iter(iter_y)

    local r_x, r_y
    repeat
        state_x, r_x = gen_x(param_x, state_x)
        if state_x == nil then
            return true
        end

        state_y, r_y = gen_y(param_y, state_y)
    until state_y == nil or r_x ~= r_y

    return false
end
```

## 前提知識

- **接頭辞（prefix）**: 列の先頭から続く部分のことです。`abc` の接頭辞は `a`、`ab`、`abc` です。
- **同時に回す**: 二つの列を、一つずつ組にして進める考え方です。片方が先に終わったら、そこで判定が決まります。
- **`repeat ... until`**: 条件が真になるまで繰り返す文です。少なくとも一回は必ず実行されます。
- **`r_x ~= r_y`**: 二つの値が違うかを調べる比べ方です。違えば、接頭辞の関係はここで崩れます。

## 何をしているか

### 1. 二つの列の準備をする

`iter(iter_x)` と `iter(iter_y)` で、それぞれの列を、3 つ組の形に直します。

### 2. 一つずつ進めて、値を比べる

`iter_x` の次の値を取り出し、もし `iter_x` が終わっていれば、それまでの値がすべて一致していたことになります。そのとき `true` を返します。終わっていなければ、`iter_y` の次の値を取り出して、二つの値を比べます。

```lua:line-numbers=654
    repeat
        state_x, r_x = gen_x(param_x, state_x)
        if state_x == nil then
            return true
        end

        state_y, r_y = gen_y(param_y, state_y)
    until state_y == nil or r_x ~= r_y
```

### 3. 途中で食い違ったら false

`repeat` の条件が、`iter_y` が終わったか、値が違うかのどちらかになると、繰り返しを抜けます。ここまで来ると、接頭辞ではないので、`false` を返します。

```lua:line-numbers=663
    return false
```

## ここがすごい

- **一度に比べ終える**: 二つの列を一緒に進めるので、比べる必要のない値は取り出されません。途中で分かれば、すぐに結論が出ます。
- **列の種類を選ばない**: 配列でも、遅延の列でも、三つ組の形にできれば、同じ関数で比べられます。
- **無限の列にも使える**: `iter_x` が有限なら、`iter_y` が無限でも、判定は終わります。
- **注意点**: `iter_y` が先に終わると、`iter_x` が残っていても `false` になります。また、列の値が `nil` を含むと、判定が途中で止まることがあります。

## まとめ

- 接頭辞の判定は、二つの列を同時に進めると、必要な分だけ比べて答えを出せる。
- 無限の列と組み合わせても、有限の側で判定が終わるので、安全に使える。
- 列が先に終わる場合の扱いを決めておくと、結果の意味がはっきりする。
