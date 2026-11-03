---
title: タブで区切って一行を出す printout
description: Lua のパッケージマネージャ LuaRocks の util.printout。引数をタブで区切って一行にし、標準出力に書きます。引数がなければ空行を出します。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [196, 199]
format: 2
function: util.printout
difficulty: 1
tags: [入出力, 可読性, イディオム]
---
## ひとことで

`util.printout(...)` は、渡された値を標準出力に一行で書き出す関数です。値の間はタブで区切られ、最後に改行が付きます。`print` と似ていますが、区切りがタブであることと、出力先が標準出力に固定されている点が違います。

## コード

```lua:line-numbers=196
function util.printout(...)
   io.stdout:write(table.concat({ ... }, "\t"))
   io.stdout:write("\n")
end
```

## 前提知識

- **可変長引数 `...`**: 関数に、いくつでも引数を渡せる書き方です。`{ ... }` で、引数を表にまとめられます。
- **`table.concat`**: 表の文字列を、区切りの文字でつなぐ標準関数です。ここでは区切りにタブ `	` を使います。
- **`io.stdout:write`**: 標準出力に、文字列をそのまま書き出すメソッドです。改行は自動では付かないので、関数の中で明示的に書きます。
- **`print` との違い**: `print` は、区切りが空白で、改行も自動で付きます。`printout` は区切りが違い、出力先の指定も直接書かれています。

## 何をしているか

### 1. 引数をタブでつないで書く

`{ ... }` で引数を表にまとめ、`table.concat` でタブ区切りの文字列にします。その結果を、標準出力へ書きます。引数が一つもなければ、空の文字列が書かれます。

```lua:line-numbers=197
   io.stdout:write(table.concat({ ... }, "\t"))
```

### 2. 最後に改行を書く

改行 `
` を書き、行を終わらせます。これで、次の出力が新しい行から始まります。

```lua:line-numbers=198
   io.stdout:write("\n")
```

## ここがすごい

- **表の形の出力が簡単**: タブで区切ると、表計算の貼り付けや、他のコマンドでの切り出しがしやすくなります。
- **出力の形が揃う**: 値の数に関係なく、一行にまとまります。出力を読む側が、形を予測しやすいです。
- **短い関数**: 二行だけで、出力の規則が全部書かれています。読んですぐ理解できます。
- **注意点**: 値がテーブルなどの場合、`table.concat` が文字列として扱えず、エラーになることがあります。数や文字列だけを渡してください。

## まとめ

- 機械も読みやすい出力は、区切りを決めて一行にまとめると作りやすい。
- 出力関数は、区切りと改行の規則を一か所に集めると、表示の形を揃えやすい。
- 文字列への変換が必要な値を渡すときは、エラーにならない型かを確かめる。
