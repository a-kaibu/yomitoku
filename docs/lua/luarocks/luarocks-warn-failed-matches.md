---
title: 置き換えられなかった変数を、警告として報告する
description: Lua のパッケージマネージャ LuaRocks の warn_failed_matches。文字列に残っている変数の印を見つけ、一つずつ警告を出します。何か残っていれば真を返します。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [127, 136]
format: 2
function: warn_failed_matches
difficulty: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`warn_failed_matches(line)` は、文字列の中に、まだ置き換えられていない変数の印が残っていないかを調べる関数です。残っている印は、一つずつ警告として表示します。一つでも残っていれば `true` を返します。変数の展開が、すべて成功したかを確かめるための関数です。

## コード

```lua:line-numbers=127
local function warn_failed_matches(line)
   local any_failed = false
   if line:match(var_format_pattern) then
      for unmatched in line:gmatch(var_format_pattern) do
         util.warning("unmatched variable " .. unmatched)
         any_failed = true
      end
   end
   return any_failed
end
```

## 前提知識

- **変数の印 `var_format_pattern`**: `$(名前)` のような、変数を表す書き方のパターンです。このパターンに一致する部分は、まだ値が入っていない変数です。
- **`line:match(...)`**: 文字列の中に、パターンが一致するかを調べます。一致すれば、一致した部分が返り、一致しなければ `nil` が返ります。
- **`gmatch`**: パターンに一致する部分を、一つずつ順に取り出す繰り返しの関数です。
- **警告の出し方**: `util.warning` は、LuaRocks の標準的な警告の表示関数です。利用者に、注意を促すために使われます。

## 何をしているか

### 1. 印があるかをざっと確かめる

まず `line:match(var_format_pattern)` で、一つでも印があるかを調べます。なければ、何もせずに終わります。

```lua:line-numbers=129
   if line:match(var_format_pattern) then
```

### 2. 残っている印を一つずつ警告する

印が見つかったら、`gmatch` で一つずつ取り出し、それぞれについて警告を出します。警告が出たことを、`any_failed` に記録します。

```lua:line-numbers=130
      for unmatched in line:gmatch(var_format_pattern) do
         util.warning("unmatched variable " .. unmatched)
         any_failed = true
      end
```

### 3. 残っていたかどうかを返す

最後に、`any_failed` を返します。呼ぶ側は、この結果を見て、後始末などの処理を決められます。

```lua:line-numbers=135
   return any_failed
```

## ここがすごい

- **どれが残ったかを示す**: 失敗したという一言だけでなく、残った変数の名前を一つずつ表示します。利用者が、直すべき場所をすぐ見つけられます。
- **二段階の確認**: 最初に印の有無を確かめてから、詳しく回るので、印がない普通の場合は、余計な処理をせずに済みます。
- **結果を返す**: 警告を出すだけでなく、残っていたかどうかを戻り値で伝えるので、呼ぶ側が後の処理を変えられます。
- **注意点**: この関数は、印の形に一致するものすべてを警告します。本当は変数ではない文字列が、印の形をしていると、誤った警告が出ることがあります。

## まとめ

- 処理の失敗を伝えるときは、どの対象が失敗したかを示すと、直す手間が減る。
- 軽い確認を先に行い、詳しい処理は必要なときだけ行うと、無駄を省ける。
- 警告と戻り値を両方用意すると、表示と後の処理を別々に扱える。
