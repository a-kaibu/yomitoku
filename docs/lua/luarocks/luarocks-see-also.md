---
title: エラーの後に続ける案内文を組み立てる see_also
description: Lua のパッケージマネージャ LuaRocks の util.see_also。エラーの後に表示する「See also」の案内を作ります。補足の文を渡せば、それを先頭に入れ、help の案内を最後に付けます。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [256, 262]
format: 2
function: util.see_also
difficulty: 1
tags: [文字列処理, 可読性, 入出力]
---
## ひとことで

`util.see_also(text)` は、コマンドの出力の末尾に付ける「See also」の案内文を組み立てる関数です。補足の文 `text` があれば、それを先に入れます。最後には、`luarocks help` を案内する一行が必ず付きます。利用者が次に何を見ればよいかを、統一した形で示すための関数です。

## コード

```lua:line-numbers=256
function util.see_also(text)
   local see_also = "See also:\n"
   if text then
      see_also = see_also .. text .. "\n"
   end
   return see_also .. "   '" .. util.this_program("luarocks") .. " help' for general options and configuration."
end
```

## 前提知識

- **文字列の連結**: `..` で、文字列どうしをつなぎます。改行の `
` も、文字列の一部として書けます。
- **省略できる引数**: `text` が `nil` のときは、補足の行を作りません。`if text then` で、有無を確かめています。
- **`util.this_program`**: 実行しているプログラムの名前を返す LuaRocks の関数です。案内に、正しいコマンド名を入れるために使われます。
- **案内文の役割**: エラーや結果の後に、関連する情報の場所を示すための、短い文章です。

## 何をしているか

### 1. 見出しと、補足の文を入れる

`see_also` の初めに、見出しとなる文字列を置きます。`text` があれば、その文と改行を続けて入れます。

```lua:line-numbers=257
   local see_also = "See also:\n"
   if text then
      see_also = see_also .. text .. "\n"
   end
```

### 2. 最後に help の案内を付ける

プログラム名を `this_program` で取り出し、`help` を案内する一行を連結します。これで、補足がなくても、必ず次の行動が示されます。

```lua:line-numbers=261
   return see_also .. "   '" .. util.this_program("luarocks") .. " help' for general options and configuration."
```

## ここがすごい

- **補足の有無に強い**: 補足がなくても、関数は正しく案内を作ります。呼ぶ側は、補足を省くだけで済みます。
- **プログラム名を動的に決める**: 名前を直接書かずに、`this_program` で取り出すので、別名で起動されても正しいコマンドを案内できます。
- **案内の形が一か所に**: 案内文の書き方を、この関数に集めています。どの場所でも、同じ形の案内になります。
- **注意点**: 文字列を連結するだけなので、`text` に改行や特殊な文字が含まれていても、そのまま出力されます。表示の見栄えは、呼ぶ側で整える必要があります。

## まとめ

- 補足を省けるようにすると、呼ぶ側の書き方が簡単になり、必要な案内だけを出せる。
- 案内は、必ず最後に同じ形のものを付けると、利用者が迷わなくなる。
- コマンド名は直接書かず、実行中の名前から作ると、別名で起動されても正しい。
