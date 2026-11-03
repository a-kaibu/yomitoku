---
title: 文字列のパターンに合う値だけを残す grep
description: LuaJIT 向け関数型ライブラリ Lua Fun の grep。値が条件に合うものだけを残します。条件には関数か、Lua のパターンの文字列を渡せます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [584, 590]
format: 2
function: grep
difficulty: 2
tags: [正規表現, 文字列処理, 関数型]
---
## ひとことで

`grep(fun_or_regexp, gen, param, state)` は、列の値のうち、条件に合うものだけを残す関数です。条件には、関数か、文字列のパターンを渡せます。文字列を渡すと、そのパターンに一致する値だけが残ります。名前は、Unix の `grep` コマンドにならったものです。

## コード

```lua:line-numbers=584
local grep = function(fun_or_regexp, gen, param, state)
    local fun = fun_or_regexp
    if type(fun_or_regexp) == "string" then
        fun = function(x) return string.find(x, fun_or_regexp) ~= nil end
    end
    return filter(fun, gen, param, state)
end
```

## 前提知識

- **Lua のパターン**: `string.find` で使う、簡単な文字列の照合の書き方です。正規表現とは少し違い、`%d` のような文字の種類を表す指定などがあります。
- **`string.find`**: 文字列の中に、パターンが一致する位置を探す標準関数です。見つからなければ `nil` を返します。
- **`filter`**: 条件に合う値だけを残す関数です。`grep` は、条件を整えてから、この `filter` に任せます。
- **型による分岐**: `type(fun_or_regexp)` で、渡されたものが文字列か関数かを確かめます。

## 何をしているか

### 1. 文字列なら、関数に変える

`fun_or_regexp` が文字列のときは、`string.find` を使う関数を作ります。値が文字列の中でパターンに一致すれば、条件が真になります。

```lua:line-numbers=585
    local fun = fun_or_regexp
    if type(fun_or_regexp) == "string" then
        fun = function(x) return string.find(x, fun_or_regexp) ~= nil end
    end
```

### 2. 条件を filter に任せる

関数に整えた条件を、`filter` に渡します。残す処理は、すべて `filter` が行います。

```lua:line-numbers=589
    return filter(fun, gen, param, state)
```

## ここがすごい

- **二つの書き方を一つに**: 関数で書いた条件と、パターンの文字列を、同じ `grep` で扱えます。呼ぶ側は、簡単な条件なら文字列で書けます。
- **変換は一か所**: 文字列から関数への変換を、この関数の中に閉じ込めています。`filter` は、常に関数だけを受け取ればよいです。
- **遅延のまま**: 条件に合う値は、使われたときに選ばれます。大きな列でも、必要な分だけが処理されます。
- **注意点**: 文字列は、そのまま Lua のパターンとして扱われます。正規表現の感覚で書くと、思わぬ一致や不一致が起きるので注意してください。また、値が文字列でないと、`string.find` が失敗することがあります。

## まとめ

- 条件の書き方を二通り用意するときは、片方を関数に変換してから、共通の処理に任せると分かりやすい。
- 文字列のパターンは、正規表現とは異なる規則を持つので、その違いを覚えておく。
- 値の型と条件の型が合うかを、呼ぶ前に確かめておくと安心である。
