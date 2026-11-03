---
title: 変数の印を値で置き換える、variable_substitutions
description: Lua のパッケージマネージャ LuaRocks の variable_substitutions。rockspec の文字列に含まれる $(名前) を、渡された値で置き換えます。置き換えられなかった印は消します。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [146, 160]
format: 2
function: util.variable_substitutions
difficulty: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`util.variable_substitutions(tbl, vars)` は、表 `tbl` の中にある文字列の変数の印を、`vars` の値で置き換える関数です。たとえば `$(PREFIX)` のような印を、実際のパスに直します。どの値にも対応しなかった印は、空にして取り除きます。設定ファイルの中の変数を展開する、LuaRocks の仕組みの一つです。

## コード

```lua:line-numbers=146
function util.variable_substitutions(tbl, vars)

   local updated = {}
   for k, v in pairs(tbl) do
      if type(v) == "string" then
         updated[k] = string.gsub(v, var_format_pattern, vars)
         if warn_failed_matches(updated[k]) then
            updated[k] = updated[k]:gsub(var_format_pattern, "")
         end
      end
   end
   for k, v in pairs(updated) do
      tbl[k] = v
   end
end
```

## 前提知識

- **`gsub` の値による置き換え**: `string.gsub(v, pattern, vars)` のように、置き換えの表を渡すと、パターンに一致した部分を、表のキーに対応する値で置き換えます。
- **`var_format_pattern`**: 変数の印の形を表すパターンです。LuaRocks のファイル内で、`$(名前)` のような書き方を見つけるために使われます。
- **`warn_failed_matches`**: 置き換えられなかった印があるかを確かめる関数です。あれば真を返します。
- **二段階の書き換え**: 先に結果を別の表 `updated` に作り、後でまとめて `tbl` に書き戻します。途中の状態を、元の表に残さないためです。

## 何をしているか

### 1. 文字列の値を、置き換えた結果として作る

`tbl` の中で、値が文字列のものを見つけます。`string.gsub` で、変数の印を `vars` の値で置き換え、結果を `updated` に入れます。

```lua:line-numbers=149
   for k, v in pairs(tbl) do
      if type(v) == "string" then
         updated[k] = string.gsub(v, var_format_pattern, vars)
```

### 2. 置き換えられなかった印を消す

`warn_failed_matches` が真なら、まだ残っている印があるということです。その印を空の文字列に置き換えて、取り除きます。

```lua:line-numbers=152
         if warn_failed_matches(updated[k]) then
            updated[k] = updated[k]:gsub(var_format_pattern, "")
         end
```

### 3. まとめて書き戻す

すべての置き換えが終わってから、`updated` の内容を `tbl` へ書き戻します。途中で作った結果を、一度に反映する形です。

```lua:line-numbers=157
   for k, v in pairs(updated) do
      tbl[k] = v
   end
```

## ここがすごい

- **二段階で壊さない**: 置き換えの途中で `tbl` を変えないので、処理の途中で失敗しても、元の表は中途半端な状態になりません。
- **置き換えの失敗を後始末**: 値がない印は、そのまま残すと後で誤動作を招きます。空にすることで、確実に取り除かれます。
- **gsub の戻り値の扱い**: `string.gsub` は 2 つの値を返しますが、代入では最初の値だけが使われます。そのため、`updated[k]` には文字列だけが入ります。
- **注意点**: 文字列以外の値は、そのまま変わりません。また、印の形が想定と違うと、置き換えられずに取り除かれる場合もあるので、印の書き方を統一しておく必要があります。

## まとめ

- 変数の展開は、結果を別の表に作ってから書き戻すと、途中の失敗に強くなる。
- 対応しなかった印は、残すより空にして取り除くほうが、後の処理の誤りを防げる。
- 文字列の置き換えは、戻り値の数に注意すると、代入の意味がはっきりする。
