---
title: 型を見て、回し方を選ぶ rawiter
description: LuaJIT 向け関数型ライブラリ Lua Fun の rawiter。配列、連想配列、文字列、関数などの値を、回すための三つ組に変えます。どの型でもない値は、エラーにします。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [109, 139]
format: 2
function: rawiter
difficulty: 3
tags: [イテレータ, 型システム, 防御的プログラミング]
---
## ひとことで

`rawiter(obj, param, state)` は、どんな値でも、回せる三つ組のイテレータに変える、Lua Fun の入口の関数です。表なら、配列か連想配列かで回し方を選びます。文字列や関数も、それぞれに対応した三つ組にします。対応しない値には、エラーを起こします。

## コード

:::: code-group

```lua:line-numbers=109 [日本語訳]
local rawiter = function(obj, param, state)
    assert(obj ~= nil, "invalid iterator")
    if type(obj) == "table" then
        local mt = getmetatable(obj);
        if mt ~= nil then
            if mt == iterator_mt then
                return obj.gen, obj.param, obj.state
            elseif mt.__ipairs ~= nil then
                return mt.__ipairs(obj)
            elseif mt.__pairs ~= nil then
                return mt.__pairs(obj)
            end
        end
        if #obj > 0 then
            -- 配列
            return ipairs(obj)
        else
            -- 連想配列
            return map_gen, obj, nil
        end
    elseif (type(obj) == "function") then
        return obj, param, state
    elseif (type(obj) == "string") then
        if #obj == 0 then
            return nil_gen, nil, nil
        end
        return string_gen, obj, 0
    end
    error(string.format('object %s of type "%s" is not iterable',
          obj, type(obj)))
end
```

```lua:line-numbers=109 [原文]
local rawiter = function(obj, param, state)
    assert(obj ~= nil, "invalid iterator")
    if type(obj) == "table" then
        local mt = getmetatable(obj);
        if mt ~= nil then
            if mt == iterator_mt then
                return obj.gen, obj.param, obj.state
            elseif mt.__ipairs ~= nil then
                return mt.__ipairs(obj)
            elseif mt.__pairs ~= nil then
                return mt.__pairs(obj)
            end
        end
        if #obj > 0 then
            -- array
            return ipairs(obj)
        else
            -- hash
            return map_gen, obj, nil
        end
    elseif (type(obj) == "function") then
        return obj, param, state
    elseif (type(obj) == "string") then
        if #obj == 0 then
            return nil_gen, nil, nil
        end
        return string_gen, obj, 0
    end
    error(string.format('object %s of type "%s" is not iterable',
          obj, type(obj)))
end
```

::::

## 前提知識

- **`assert(obj ~= nil)`**: 値が `nil` なら、列を作れないので、最初にエラーにします。
- **metatable による専用の回し方**: 表に `__ipairs` や `__pairs` があれば、その表が決めた回し方を使います。利用者が、回し方を独自に決められる仕組みです。
- **`#obj > 0`**: 表の長さが正なら、配列とみなします。そうでなければ、連想配列として扱います。
- **`error(string.format(...))`**: 対応しない型のときに、型名を含むエラーを起こします。

## 何をしているか

### 1. 表なら、metatable を先に確かめる

表に metatable があれば、Lua Fun の列か、`__ipairs` か `__pairs` を持つかを順に調べます。それぞれに対応する三つ組を返します。

```lua:line-numbers=112
        local mt = getmetatable(obj);
        if mt ~= nil then
            if mt == iterator_mt then
                return obj.gen, obj.param, obj.state
            elseif mt.__ipairs ~= nil then
                return mt.__ipairs(obj)
            elseif mt.__pairs ~= nil then
                return mt.__pairs(obj)
            end
```

### 2. 配列か連想配列かで、回し方を選ぶ

metatable に指定がなければ、表の長さで判断します。長さが正なら配列として `ipairs` を、そうでなければ `map_gen` で連想配列を回します。

```lua:line-numbers=122
        if #obj > 0 then
            -- array
            return ipairs(obj)
        else
            -- hash
            return map_gen, obj, nil
```

### 3. 関数と文字列も、三つ組にする

値が関数なら、そのまま三つ組として使います。文字列は、空なら終わりの三つ組を、そうでなければ `string_gen` で一文字ずつ回します。

```lua:line-numbers=129
    elseif (type(obj) == "function") then
        return obj, param, state
    elseif (type(obj) == "string") then
        if #obj == 0 then
            return nil_gen, nil, nil
        end
        return string_gen, obj, 0
```

### 4. どれにも当たらなければ、エラーにする

表、関数、文字列のどれでもなければ、回せないので、型名を付けたエラーを起こします。

```lua:line-numbers=137
    error(string.format('object %s of type "%s" is not iterable',
          obj, type(obj)))
```

## ここがすごい

- **一つの入口で何でも受け止める**: 利用者は、配列、連想配列、文字列、関数を、同じ書き方で渡せます。列の種類を気にしなくてよいです。
- **拡張の口がある**: `__ipairs` や `__pairs` を見るので、独自の型も、自分の回し方で列にできます。
- **失敗は早く、分かりやすく**: 対応しない型は、型名を付けて、すぐに知らせます。原因を探す手間が省けます。
- **注意点**: 配列か連想配列かを長さで決めるので、穴のある配列は、連想配列として扱われることがあります。並びの形が大事な場合は、注意してください。

## まとめ

- どの型でも受け止める入口は、型ごとの分岐を一か所にまとめると、使い手の書き方が自由になる。
- 拡張の仕組みを、metatable の印で用意すると、新しい型を後から足せる。
- 対応しない値は、型名を付けて早く知らせると、原因を見つけやすい。
