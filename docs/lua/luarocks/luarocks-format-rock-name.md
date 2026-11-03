---
title: 名前空間・名前・版を、1 つの表示用の文字列にまとめる
description: Lua のパッケージマネージャ LuaRocks の util.format_rock_name。名前空間、パッケージ名、版を、条件に応じて省きながら "namespace/name version" の形にします。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [231, 233]
format: 2
function: util.format_rock_name
difficulty: 1
tags: [文字列処理, 可読性, イディオム]
---

## ひとことで

`util.format_rock_name(name, namespace, version)` は、パッケージの名前を、表示しやすい 1 つの文字列にする関数です。名前空間があれば `名前空間/` を前に付け、版があれば ` 版` を後ろに付けます。どちらもなければ、名前だけを返します。

## コード

```lua:line-numbers=231
function util.format_rock_name(name, namespace, version)
   return (namespace and namespace .. "/" or "") .. name .. (version and " " .. version or "")
end
```

## 前提知識

- **`and` と `or` による条件式**: `a and b or c` は、`a` が真なら `b`、そうでなければ `c` を返す形です。`b` が `nil` や `false` のときは注意が要ります。
- **文字列の連結 `..`**: 文字列をつなげる Lua の演算子です。
- **省略可能な引数**: `namespace` と `version` は `nil` のとき省かれます。

## 何をしているか

### 1. 名前空間があれば前に付ける

```lua:line-numbers=232
   return (namespace and namespace .. "/" or "") .. name .. (version and " " .. version or "")
```

`namespace and namespace .. "/" or ""` は、名前空間があれば `名前空間/`、なければ空の文字列を作ります。

### 2. 名前を置く

`name` は必ず入るので、その後ろにそのまま連結します。

### 3. 版があれば後ろに付ける

`version and " " .. version or ""` は、版があれば空白と版、なければ空の文字列を作ります。


補足として、この形の表示は、ログやエラーメッセージで使われる場面が多いです。名前空間が付いているものと付いていないものを、同じ書き方で並べて見せられるので、利用者が見分けやすくなります。

## ここがすごい

- **条件で省くことで、どの組み合わせでも正しい形になる**: 名前空間と版の有無の 4 通りに、1 つの式で対応しています。
- **表示の形をこの関数に集める**: 名前の表示の仕方を 1 か所で決めているので、表示を変えるときは、この関数だけを直せば済みます。
- **注意点**: `and` と `or` の形は、左側が `nil` や `false` になるときに、右側が使われてしまいます。ここでは、名前空間も版も文字列なので、その心配はありません。

## まとめ

- 任意の部分を含む表示は、条件付きの連結で 1 つの文字列にまとめられる。
- 表示の形を 1 つの関数に集めると、変更が楽になる。
