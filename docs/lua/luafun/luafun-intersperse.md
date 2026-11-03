---
title: 値と値の間に、区切りの値を差し込む intersperse
description: LuaJIT 向け関数型ライブラリ Lua Fun の intersperse。イテレータの値の間に、決まった値を 1 つずつ挟みます。偶数番目と奇数番目で、取り出す値を切り替えるのがポイントです。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [884, 886]
format: 2
function: intersperse
difficulty: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`intersperse(x, gen, param, state)` は、イテレータの値と値の間に、区切りの値 `x` を 1 つずつ入れるイテレータを作る関数です。`fun.intersperse(",", list)` は、`a`、`,`、`b`、`,`、`c` のような列を作ります。文字列の区切りを作る `table.concat` のような処理を、遅延評価の列として行えます。

## コード

```lua:line-numbers=884
local intersperse = function(x, gen, param, state)
    return wrap(intersperse_gen, {x, gen, param}, {0, state})
end
```

次の値を作る `intersperse_gen` と、その補助の `intersperse_call` も、読むのに必要なので引用します。

```lua:line-numbers=873
local intersperse_gen = function(param, state)
    local x, gen_x, param_x = param[1], param[2], param[3]
    local i, state_x = state[1], state[2]
    if i % 2 == 1 then
        return {i + 1, state_x}, x
    else
        return intersperse_call(i, gen_x(param_x, state_x))
    end
end
```

```lua:line-numbers=866
local intersperse_call = function(i, state_x, ...)
    if state_x == nil then
        return nil
    end
    return {i + 1, state_x}, ...
end
```

## 前提知識

- **`%`（剰余）**: `i % 2` は、2 で割った余りです。`i % 2 == 1` で奇数かどうかを判定します。
- **状態の番号**: 状態の最初の数は、今どの位置を出しているかを表す番号です。
- **区切りの位置**: 区切りは、値と値の間にだけ入ります。先頭には入らず、末尾にも入らない形を目指します。

## 何をしているか

### 1. 奇数の回では区切りを出す

`i` が奇数のとき、`x`（区切りの値）を返します。状態は元の状態のまま、番号だけを 1 つ進めます。

```lua:line-numbers=877
        return {i + 1, state_x}, x
```

### 2. 偶数の回では元の値を出す

偶数のときは、元のイテレータから次の値を取り出します。`intersperse_call` が、その値を返します。

```lua:line-numbers=879
        return intersperse_call(i, gen_x(param_x, state_x))
```

### 3. 初期状態

`intersperse` は、状態を `{0, state}` で始めます。番号が 0 なので、最初の回は偶数の扱いになり、元の最初の値から出る仕組みです。


補足として、`intersperse` は表示用の区切りを作るのに向いています。カンマ区切りの一覧や、改行を挟んだ文章の列など、区切りの値を 1 か所で決めて使えます。

## ここがすごい

- **番号の偶奇で切り替える**: 区切りと値を、1 つの番号の偶奇だけで交互に出します。余計な変数や分岐が要りません。
- **元の列を変えない**: 区切りを入れるために列を複製せず、必要な回ごとに値を出すので、遅延評価のまま動きます。
- **注意点**: ソースのコメントにもあるように、この実装は最後に区切りを付け足す場合があります。区切りを末尾に入れたくないときは、結果を確かめてから使ってください。

## まとめ

- 区切りを挟むには、番号の偶奇で「区切り」と「元の値」を交互に出すと簡単。
- 初期状態の番号を、最初の回の振る舞いに合わせて決める。
