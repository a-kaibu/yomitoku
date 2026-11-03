---
title: 見出しを、下線つきで表示する title
description: Lua のパッケージマネージャ LuaRocks の util.title。メッセージを下線つきの見出しとして表示します。機械向けの出力では、何も表示しません。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [201, 207]
format: 2
function: util.title
difficulty: 1
tags: [入出力, 可読性, イディオム]
---
## ひとことで

`util.title(msg, porcelain, underline)` は、コマンドの出力に見出しを表示する関数です。メッセージの下に、同じ長さの下線を引きます。`porcelain` が真のとき、つまり機械に読ませる出力のときは、何も表示しません。人向けの見やすさと、機械向けの簡潔さを両立させるための関数です。

## コード

```lua:line-numbers=201
function util.title(msg, porcelain, underline)
   if porcelain then return end
   util.printout()
   util.printout(msg)
   util.printout((underline or "-"):rep(#msg))
   util.printout()
end
```

## 前提知識

- **`porcelain` の意味**: Git の用語にならった、機械が読むための出力の形を指します。人の目を想定した装飾を省きます。
- **`(underline or "-"):rep(#msg)`**: 下線の文字を、`underline` か、省略時の `-` にして、メッセージの長さだけ繰り返します。`rep` は文字列を繰り返す標準のメソッドです。
- **`#msg`**: 文字列の長さを返します。バイト数で数えるので、多バイト文字では見た目の幅と一致しないことがあります。
- **`util.printout`**: 表示を担当する LuaRocks の関数です。空の引数で呼ぶと、空行を出します。

## 何をしているか

### 1. 機械向けなら何もしない

`porcelain` が真なら、`return` して終わります。見出しも空行も出さないので、出力は機械が読みやすい形のままになります。

```lua:line-numbers=202
   if porcelain then return end
```

### 2. 見出しの前後に空行を入れる

まず空行を一つ出し、次にメッセージを表示します。見出しが他の出力から離れて、読みやすくなります。

```lua:line-numbers=203
   util.printout()
   util.printout(msg)
```

### 3. 下線を引いて、後ろに空行を入れる

メッセージの長さに合わせた下線を、`underline` の文字で引きます。最後に空行を入れて、見出しのまとまりを区切ります。

```lua:line-numbers=205
   util.printout((underline or "-"):rep(#msg))
   util.printout()
```

## ここがすごい

- **表示の形を一か所に集める**: 見出しの書き方を、この関数だけに置いています。どのコマンドでも、同じ見た目の見出しになります。
- **機械向けを分ける**: 装飾を、`porcelain` で完全に切り離しています。スクリプトから呼ばれても、余計な文字が混ざりません。
- **下線の長さを自動で決める**: 文字数に合わせて下線を作るので、見出しの長さを呼ぶ側が気にしなくてよくなります。
- **注意点**: 多バイト文字の場合、`#msg` はバイト数になります。日本語などでは、下線が実際の見た目より長くなることがあります。

## まとめ

- 人向けと機械向けの出力は、一つの引数で分けると、呼び出し側の分岐が要らなくなる。
- 装飾の形は一か所にまとめると、表示の統一が保ちやすい。
- 文字列の長さを使うときは、バイト数と見た目の幅の違いに注意する。
