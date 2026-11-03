---
title: 親があれば継承、なければ素のクラスを作る一行の分岐
description: Lua のクラスライブラリ middleclass の class 関数。名前と親クラスを受け取り、親があれば subclass で子を、なければ標準の部品を取り込んだ新しいクラスを作ります。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [186, 189]
format: 2
function: middleclass.class
difficulty: 2
tags: [設計パターン, メタプログラミング, 型システム]
---

## ひとことで

`middleclass.class(name, super)` は、新しいクラスを作る公開の関数です。`super` を渡すと、それを親とした子クラスを作ります。`super` を省くと、ライブラリの標準の機能（`new`、`isInstanceOf` など）を備えた、親のないクラスを作ります。使う側は、どちらの場合も同じ `class` という名前で呼べます。

## コード

```lua:line-numbers=186
function middleclass.class(name, super)
  assert(type(name) == 'string', "A name (string) is needed for the new class")
  return super and super:subclass(name) or _includeMixin(_createClass(name), DefaultMixin)
end
```

`class` を、`Dog(...)` のように関数として呼べるようにする仕掛けも、読むのに必要なので引用します。

```lua:line-numbers=191
setmetatable(middleclass, { __call = function(_, ...) return middleclass.class(...) end })
```

## 前提知識

- **`super:subclass(name)`**: 親クラスの `subclass` という関数を呼んで、子クラスを作ります。middleclass では、親の情報を引き継いだ新しいクラスができます。
- **`and` と `or` による分岐**: `a and b or c` は、`a` が真なら `b`、そうでなければ `c` を返す、Lua の 1 行の分岐です。ただし `b` が `nil` や `false` のときは `c` になるので、注意が要ります。
- **`DefaultMixin`**: 親のないクラスが最初から持っている機能の表です。`new` や `isInstanceOf` などが入っています。
- **`__call`**: テーブルを関数として呼んだときに動く仕組みです。`middleclass(...)` と書くと、`class` と同じ働きをします。

## 何をしているか

### 1. 名前が文字列か確かめる

クラスには名前が必要なので、最初に `name` が文字列かを `assert` で確かめます。名前がないと、後で表示や比較で困るからです。

```lua:line-numbers=187
  assert(type(name) == 'string', "A name (string) is needed for the new class")
```

### 2. 親があれば子を、なければ素のクラスを作る

`super and super:subclass(name)` は、親があれば子クラスを作ります。親がなければ `nil` になるので、`or` の右側へ進みます。右側の `_includeMixin(_createClass(name), DefaultMixin)` は、新しいクラスを作って、標準の機能を取り込みます。

```lua:line-numbers=188
  return super and super:subclass(name) or _includeMixin(_createClass(name), DefaultMixin)
```

### 3. 呼び出し方を 1 つにそろえる

`setmetatable(middleclass, { __call = ... })` で、ライブラリ自身を関数のように呼べるようにします。`middleclass("Dog", Animal)` と `middleclass.class("Dog", Animal)` が、同じ結果になります。

## ここがすごい

- **1 行で 2 つの場合を分ける**: 親があるかどうかで作り方が変わりますが、`and` と `or` の組み合わせで 1 行に収めています。読む人は、「親があれば子、なければ素」と理解すれば十分です。
- **入口を 1 つにする**: 子を作る道と、素のクラスを作る道が、同じ `class` の入口に集まっています。使う側は、どちらのクラスを作るかを意識せずに済みます。
- **注意点（`and` と `or` の落とし穴）**: `super:subclass(name)` が `nil` や `false` を返すと、`or` の右側が実行されてしまいます。この関数はそうならない前提で書かれています。同じ書き方を使うときは、左側の値が必ず真になるかを確かめる必要があります。
- **名前の確認を先に**: `assert` を最初に置くことで、名前が間違っているときは、ほかの処理が始まる前に止まります。

## まとめ

- 親の有無で作り方を変えるときは、`and` と `or` の 1 行の分岐が使える。
- ただし、左側が `nil` や `false` になりうるなら、その分岐は使わないほうが安全。
- 公開の入口を 1 つにまとめると、使う側の書き方が単純になる。
