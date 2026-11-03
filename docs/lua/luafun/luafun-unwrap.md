---
title: 列の表から三つ組を取り出す unwrap
description: LuaJIT 向け関数型ライブラリ Lua Fun の unwrap。wrap でまとめた列の表から、イテレータの関数、材料、状態の三つを取り出します。他の関数に、三つ組の形で渡すときに使います。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [79, 81]
format: 2
function: unwrap
difficulty: 1
tags: [設計パターン, イテレータ, 可読性]
---
## ひとことで

`unwrap(self)` は、`wrap` でまとめた列の表から、中の三つ組を取り出す関数です。`gen`、`param`、`state` の三つを、そのまま返します。`wrap` の逆の操作で、表の形を、普通の Lua のイテレータの形に戻します。

## コード

```lua:line-numbers=79
local unwrap = function(self)
    return self.gen, self.param, self.state
end
```

## 前提知識

- **`wrap` の逆**: `wrap` は三つ組を表にまとめます。`unwrap` は表から三つ組を取り出します。対になる関数です。
- **メソッドの第一引数 `self`**: `obj:unwrap()` のように呼ぶと、`self` に `obj` が渡されます。その表の中身を読むための引数です。
- **三つ組の戻り値**: `return self.gen, self.param, self.state` は、三つの値をまとめて返します。`for ... in` で直接使える形です。
- **表の鍵**: `self.gen` のように、表の鍵を名前で読みます。`wrap` が入れた鍵が、そのまま取り出せます。

## 何をしているか

### 1. 表から三つの値を読み出す

`self` の鍵 `gen`、`param`、`state` を、それぞれ読み出します。読み出した値は、そのまま戻り値になります。

```lua:line-numbers=80
    return self.gen, self.param, self.state
```

## ここがすごい

- **とても短い**: 一行の読み出しだけで、中身の三つ組が手に入ります。仕組みが理解しやすいです。
- **表と三つ組の行き来ができる**: `wrap` と `unwrap` を対で使えば、どちらの形でも自由に渡せます。
- **他の関数との橋渡し**: 三つ組の形を求める関数に、列の表を渡すとき、この関数で形を合わせられます。
- **注意点**: 取り出した `state` は、表の中の値と同じものです。取り出した後で、列を進めても、表の中の状態は変わりません。

## まとめ

- 表にまとめた列は、対になる関数で、いつでも元の三つ組に戻せる。
- 小さな関数でも、対で設計すると、データの形の変換を分かりやすく保てる。
- 状態が進む仕組みを理解しておくと、表の中身の変化を追いやすい。
