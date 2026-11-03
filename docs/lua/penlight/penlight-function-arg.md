---
title: 引数を関数として取り出す、function_arg の型ごとの分岐
description: Lua のユーティリティ集 Penlight の utils.function_arg。引数を、関数、演算子の文字列、呼び出せる表などに応じて、関数に変えて返します。変えられない値はエラーにします。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [435, 464]
format: 2
function: utils.function_arg
difficulty: 3
tags: [関数型, 型システム, 防御的プログラミング]
---
## ひとことで

`utils.function_arg(idx, f, msg)` は、引数 `f` を、必ず関数として使える形に直して返す関数です。関数はそのまま、`'=='` のような演算子の文字列は演算子の関数に、呼び出せる表は工場を通して関数に変えます。どれにも当てはまらなければ、引数の番号つきのエラーを起こします。

## コード

:::: code-group

```lua:line-numbers=435 [日本語訳]
function utils.function_arg (idx,f,msg)
    utils.assert_arg(1,idx,'number')
    local tp = type(f)
    if tp == 'function' then return f end  -- 何もしない
    -- 文字列は、演算子（'==' など）に対応することがある
    if tp == 'string' then
        if not operators then operators = require 'pl.operator'.optable end
        local fn = operators[f]
        if fn then return fn end
        local fn, err = utils.string_lambda(f)
        if not fn then error(err..': '..f) end
        return fn
    elseif tp == 'table' or tp == 'userdata' then
        local mt = getmetatable(f)
        if not mt then error('not a callable object',2) end
        local ff = _function_factories[mt]
        if not ff then
            if not mt.__call then error('not a callable object',2) end
            return f
        else
            return ff(f) -- この型には関数の工場があるので、それを使う
        end
    end
    if not msg then msg = " must be callable" end
    if idx > 0 then
        error("argument "..idx..": "..msg,2)
    else
        error(msg,2)
    end
end
```

```lua:line-numbers=435 [原文]
function utils.function_arg (idx,f,msg)
    utils.assert_arg(1,idx,'number')
    local tp = type(f)
    if tp == 'function' then return f end  -- no worries!
    -- ok, a string can correspond to an operator (like '==')
    if tp == 'string' then
        if not operators then operators = require 'pl.operator'.optable end
        local fn = operators[f]
        if fn then return fn end
        local fn, err = utils.string_lambda(f)
        if not fn then error(err..': '..f) end
        return fn
    elseif tp == 'table' or tp == 'userdata' then
        local mt = getmetatable(f)
        if not mt then error('not a callable object',2) end
        local ff = _function_factories[mt]
        if not ff then
            if not mt.__call then error('not a callable object',2) end
            return f
        else
            return ff(f) -- we have a function factory for this type!
        end
    end
    if not msg then msg = " must be callable" end
    if idx > 0 then
        error("argument "..idx..": "..msg,2)
    else
        error(msg,2)
    end
end
```

::::

## 前提知識

- **`type(f)`**: 値の型名を文字列で返す標準関数です。ここで、関数、文字列、表などを振り分けます。
- **演算子の表 `operators`**: `'=='` や `'+'` などの文字列と、対応する関数を結びつける表です。Penlight の `pl.operator` が提供します。
- **`utils.string_lambda`**: 短い式の文字列を、関数に変える Penlight の関数です。演算子以外の文字列は、この関数で処理されます。
- **`_function_factories`**: 前の記事で扱った、metatable と工場の対応表です。

## 何をしているか

### 1. 関数ならそのまま返す

引数が関数なら、何もせずに返します。もっとも単純な場合です。

```lua:line-numbers=437
    local tp = type(f)
    if tp == 'function' then return f end  -- no worries!
```

### 2. 文字列なら、演算子か式として関数にする

文字列が演算子の名前に一致すれば、その演算子の関数を返します。一致しなければ、`string_lambda` で式として関数に変えます。どちらも失敗すれば、エラーにします。

```lua:line-numbers=440
    if tp == 'string' then
        if not operators then operators = require 'pl.operator'.optable end
        local fn = operators[f]
        if fn then return fn end
        local fn, err = utils.string_lambda(f)
        if not fn then error(err..': '..f) end
        return fn
```

### 3. 表やユーザーデータなら、工場か __call を使う

metatable があり、登録された工場があれば、その工場で関数に変えます。工場がなくても、`__call` を持つ値なら、そのまま呼べるので返します。どちらもなければ、エラーです。

```lua:line-numbers=447
    elseif tp == 'table' or tp == 'userdata' then
        local mt = getmetatable(f)
        if not mt then error('not a callable object',2) end
        local ff = _function_factories[mt]
        if not ff then
            if not mt.__call then error('not a callable object',2) end
            return f
        else
            return ff(f) -- we have a function factory for this type!
        end
```

### 4. 当てはまらなければ、エラーにする

関数、文字列、表以外の値は、呼び出せないのでエラーにします。引数の番号があれば、その番号を付けて伝えます。

```lua:line-numbers=458
    if not msg then msg = " must be callable" end
    if idx > 0 then
        error("argument "..idx..": "..msg,2)
    else
        error(msg,2)
    end
```

## ここがすごい

- **多様な指定を受け止める**: 関数、演算子、式、呼び出せるオブジェクトのどれでも、同じ引数の場所に渡せます。呼ぶ側の書き方が自由になります。
- **失敗の伝え方が丁寧**: どの引数が悪いのかを、番号つきで伝えます。デバッグが速くなります。
- **拡張の口がある**: 工場の仕組みで、新しい型も後から扱えるようにしています。
- **注意点**: 文字列を式として解釈するので、信頼できない入力を渡すと、思わぬ処理が実行されるおそれがあります。外部からの文字列は、必ず確かめてください。

## まとめ

- 多様な指定を一つの形に揃えるには、型ごとに分岐して関数に変える関数を用意すると便利である。
- 失敗の理由は、引数の番号つきで伝えると、直す場所がすぐ分かる。
- 文字列を式として扱うときは、入力の出所を信用しない。
