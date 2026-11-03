---
title: インスタンスの表示名を作る、既定の __tostring
description: Lua のクラスライブラリ kikito/middleclass の既定の __tostring。インスタンスを文字列にすると、「instance of」と所属するクラスの名前を返します。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [124, 126]
format: 2
function: __tostring
difficulty: 1
tags: [メタプログラミング, 可読性, 設計パターン]
---
## ひとことで

`DefaultMixin.__tostring(self)` は、middleclass のインスタンスを文字列にしたときの、既定の表示を決める関数です。「instance of」と、そのインスタンスが属するクラスの表示を組み合わせた文字列を返します。`print` でインスタンスを確かめるときに、何のインスタンスかがすぐ分かります。

## コード

```lua:line-numbers=124
local DefaultMixin = {
  __tostring   = function(self) return "instance of " .. tostring(self.class) end,

```

## 前提知識

- **`DefaultMixin`**: middleclass が、すべてのクラスに最初から入れておく基本の部品の表です。既定の振る舞いが、ここにまとめられています。
- **`__tostring`**: metatable に入れると、`tostring` や `print` が使う、文字列化の関数です。
- **`self.class`**: インスタンスが属するクラスを、`class` の鍵から取り出します。表示にクラスの名前を使うため、この値を使います。
- **`..` による連結**: 文字列をつなぐ演算子です。「instance of 」に、クラスの文字列表現を連結しています。

## 何をしているか

### 1. クラスを文字列にする

`tostring(self.class)` で、インスタンスの属するクラスを文字列にします。クラスにも、表示用の `__tostring` が付いているので、その名前が使われます。

```lua:line-numbers=125
  __tostring   = function(self) return "instance of " .. tostring(self.class) end,
```

### 2. 前置きの文字列とつなぐ

「instance of 」の文字列に、クラスの表示をつないで返します。これが、インスタンスの表示になります。

```lua:line-numbers=125
  __tostring   = function(self) return "instance of " .. tostring(self.class) end,
```

## ここがすごい

- **何のインスタンスか分かる**: 表示を見ただけで、どのクラスから作られたかが分かります。デバッグの手間が減ります。
- **既定値として全体に効く**: `DefaultMixin` に入っているので、すべてのクラスのインスタンスで、同じ表示になります。
- **クラスの表示を再利用**: インスタンスの表示は、クラスの表示を使って作られます。クラスの名前を変えれば、インスタンスの表示も変わります。
- **注意点**: クラスの表示が文字列でないと、連結でエラーになります。子クラスで表示を変えるときは、必ず文字列を返すようにしてください。

## まとめ

- インスタンスの表示は、クラスの表示を組み合わせると、一貫した形で作れる。
- 既定の振る舞いを基本の部品にまとめると、すべてのクラスで同じ表示が得られる。
- 表示を組み立てる元になる値は、型を揃えておくと、連結でエラーにならない。
