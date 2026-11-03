---
title: 数を丸めてから表示する、log の tostring
description: Lua の小さなログライブラリ rxi/log.lua の tostring。引数を空白で区切った一行にまとめます。数は小数第 2 位までに丸めてから文字にするので、表示が読みやすくなります。
language: lua
project: log.lua
repo: https://github.com/rxi/log.lua
license: MIT
copyright: Copyright (c) 2016 rxi
commit: "7396ae2ee6d68829aecbc96d0b2ee1e5620c1ed7"
file: log.lua
lines: [42, 52]
format: 2
function: tostring
difficulty: 2
tags: [文字列処理, 可読性, イディオム]
---
## ひとことで

ここでの `tostring(...)` は、標準の `tostring` を置き換えた、ログ用の関数です。複数の引数を受け取り、それぞれを文字列にして空白で区切った一行にします。数は、表示が長くならないように、小数第 2 位までに丸めてから文字にします。ログに値を並べて出すための、小さな関数です。

## コード

```lua:line-numbers=42
local tostring = function(...)
  local t = {}
  for i = 1, select('#', ...) do
    local x = select(i, ...)
    if type(x) == "number" then
      x = round(x, .01)
    end
    t[#t + 1] = _tostring(x)
  end
  return table.concat(t, " ")
end
```

## 前提知識

- **標準の `tostring` を退避**: `local _tostring = tostring` で、標準の関数を別の名前に残しています。その後で `tostring` を新しい関数に置き換えても、中では元の関数を呼べます。
- **可変長引数 `...`**: 関数に、いくつでも引数を渡せる書き方です。`select('#', ...)` で数を、`select(i, ...)` で `i` 番目を取り出せます。
- **`round`**: 数を丸めるための関数です。ここでは増分 `.01` を使い、小数第 2 位までに揃えます。
- **`table.concat`**: 表の文字列を、区切りの文字で一つにつなぐ標準関数です。

## 何をしているか

### 1. 引数を一つずつ取り出し、数だけを丸める

`select('#', ...)` の数だけ回し、各引数を取り出します。引数が数なら、`round(x, .01)` で丸めます。

```lua:line-numbers=43
  local t = {}
  for i = 1, select('#', ...) do
    local x = select(i, ...)
    if type(x) == "number" then
      x = round(x, .01)
    end
```

### 2. 文字列にして、表に集める

丸めた値を、退避しておいた `_tostring` で文字列にします。結果は、表 `t` の末尾に一つずつ入ります。

```lua:line-numbers=49
    t[#t + 1] = _tostring(x)
```

### 3. 空白で区切って一行にする

`table.concat(t, " ")` で、すべての文字列を空白でつなぎ、一つの文字列として返します。

```lua:line-numbers=51
  return table.concat(t, " ")
```

## ここがすごい

- **同じ名前で振る舞いを拡張**: 標準の `tostring` と同じ名前で、ログ用の動きを足しています。呼び出しの書き方は変わりません。
- **数の見やすさ**: 長い小数を、丸めて表示するので、ログの行が読みやすくなります。
- **型を問わない**: 数でも、文字列でも、表でも、`tostring` を通すので、同じように並べられます。
- **注意点**: 丸めるのは数だけです。文字列の中の数は変わりません。また、丸めの規則により、ちょうど中間の値は思った通りにならないことがあります。

## まとめ

- 標準の関数を拡張するときは、元の関数を退避しておくと、中で安全に呼べる。
- 表示用の関数は、型ごとの前処理を入れると、ログの読みやすさが上がる。
- 複数の値をまとめるときは、表に集めてから一度に連結すると、無駄な文字列の作成を減らせる。
