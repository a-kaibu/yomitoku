---
title: 改行と字下げを、深さの数だけ一度に書く
description: Lua のデバッグ表示ライブラリ inspect.lua の tabify。現在の深さに応じて改行と空白を書き出し、入れ子の表示を字下げつきで読みやすくします。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [256, 258]
format: 2
function: tabify
difficulty: 1
tags: [文字列処理, 可読性, 入出力]
---

## ひとことで

`tabify(inspector)` は、表示の途中で改行と字下げを書き出す関数です。入れ子が深くなるほど、字下げの空白を多く書きます。表示結果を、人が追いやすい形にするための小さな関数です。

## コード

```lua:line-numbers=256
local function tabify(inspector)
   puts(inspector.buf, inspector.newline .. rep(inspector.indent, inspector.level))
end
```

## 前提知識

- **字下げ（インデント）**: 入れ子の深さを、行頭の空白で表す書き方です。
- **`inspector` の状態**: `newline`（改行の文字）、`indent`（1 段の空白）、`level`（今の深さ）を持つ表です。
- **`rep`**: 文字列を指定した回数だけ繰り返す関数です。`rep("  ", 3)` は `"      "` になります。
- **`puts`**: 出力用のバッファに文字列を追加する関数です。

## 何をしているか

### 1. 改行と字下げを 1 つの文字列にする

`rep(inspector.indent, inspector.level)` で、深さ分の字下げを作ります。その前に `inspector.newline` を置いて、1 行分の改行と字下げを 1 つの文字列にします。

```lua:line-numbers=257
   puts(inspector.buf, inspector.newline .. rep(inspector.indent, inspector.level))
```

### 2. バッファに追加する

作った文字列を `puts` でバッファに入れます。最後にバッファをまとめて文字列にすれば、表示の結果が得られます。


補足として、字下げは `inspector.level` を読むだけで決まるので、表示の途中で深さを変えても、この関数の中身は変わりません。深さの管理と、書き出しの処理を分けておくと、表示の形を変えるときに触る場所が少なくて済みます。


もう一つ、字下げを 1 関数に分けておくと、表示の形を「2 スペース」から「タブ」へ変えるような変更も、この関数 1 つを直すだけで済みます。

## ここがすごい

- **深さを状態から決める**: 字下げを呼び出し側が計算せず、`level` を持つ状態から自動で決めます。入れ子の処理は、深さを増減させるだけで済みます。
- **改行と字下げを 1 回で出す**: 行の区切りと字下げを、1 回の呼び出しでまとめて出すので、書き忘れが起きにくくなっています。
- **注意点**: `level` が負になると、`rep` の回数が負になって空白が出ません。深さの増減は、必ず対になるように書く必要があります。

## まとめ

- 字下げは、深さを状態に持たせて、必要なときに必要な分だけ書き出すと簡単。
- 改行と字下げを 1 つの関数にまとめると、表示の形がそろう。
