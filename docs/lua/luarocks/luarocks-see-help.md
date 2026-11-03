---
title: help の案内文を、コマンド名つきで作る see_help
description: Lua のパッケージマネージャ LuaRocks の util.see_help。特定のコマンドの help を案内する文を作ります。コマンド名を省くと、全体の help を案内します。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [252, 254]
format: 2
function: util.see_help
difficulty: 1
tags: [文字列処理, 可読性, イディオム]
---
## ひとことで

`util.see_help(command, program)` は、エラーの後などに「詳しくは help を見てください」と案内する文を作る関数です。`command` を渡すと、そのコマンドの help を指す文になります。省略すると、全体の help を指します。案内の文を、一か所で統一するための関数です。

## コード

```lua:line-numbers=252
function util.see_help(command, program)
   return "See '" .. util.this_program(program or "luarocks") .. ' help' .. (command and " " .. command or "") .. "'."
end
```

## 前提知識

- **省略時の既定値**: `program or "luarocks"` は、`program` が `nil` のときに `"luarocks"` を使う書き方です。
- **条件つきの連結**: `(command and " " .. command or "")` は、`command` があれば空白と名前を、なければ空の文字列を連結します。`and` と `or` の組み合わせで、条件に応じた文字列を作れます。
- **`util.this_program`**: 実行中のプログラム名を返す関数です。既定の名前を渡して、別名で起動されても正しい名前を得ます。
- **文字列の連結 `..`**: 複数の部分を、一つの文として組み立てる演算子です。

## 何をしているか

### 1. プログラム名を決めて、help の文を組み立てる

`this_program(program or "luarocks")` で、プログラム名を取り出します。その後に、` help` を連結します。

```lua:line-numbers=253
   return "See '" .. util.this_program(program or "luarocks") .. ' help' .. (command and " " .. command or "") .. "'."
```

### 2. コマンド名があれば、その名前を末尾に付ける

`command` があれば、空白とコマンド名を付けます。なければ何も付けずに、閉じの引用符へ続けます。最後に、`'.` を付けて文を終えます。

```lua:line-numbers=253
   return "See '" .. util.this_program(program or "luarocks") .. ' help' .. (command and " " .. command or "") .. "'."
```

## ここがすごい

- **一行で案内を完成させる**: 名前の取り出し、条件つきの連結、締めの文字が、一つの式に収まっています。
- **既定値の仕組み**: 呼ぶ側は、コマンド名もプログラム名も省けます。最小の指定で、正しい案内が得られます。
- **表示の形を統一**: 案内の文を、この関数に集中させています。複数の場所で、同じ言い回しの案内を使えます。
- **注意点**: 条件つきの連結は、読みにくくなりやすいです。`command` が空の文字列のときも、空白が付く点に注意してください。

## まとめ

- 既定値と条件つきの連結を組み合わせると、一つの関数で複数の案内を作れる。
- 案内の文は、一か所にまとめると、表記の統一が保ちやすい。
- 条件による文字列の組み立ては、結果を確かめながら書くと、思わぬ空白を防げる。
