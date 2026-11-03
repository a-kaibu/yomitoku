---
title: 部品のテーブルを、クラスにまとめて足す mixin の仕組み
description: Lua のクラスライブラリ middleclass の _includeMixin。部品（mixin）のメソッドをクラスに写し、クラス用の関数（static）は別の表に移します。included の通知もここで行います。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [109, 122]
format: 2
function: _includeMixin
difficulty: 2
tags: [設計パターン, メタプログラミング, イテレータ]
---

## ひとことで

`_includeMixin(aClass, mixin)` は、機能の部品（mixin）をクラスに取り込む内部関数です。部品のテーブルにあるメソッドを、クラスの中に写します。ただし `static`（クラス自身の関数）は別の場所に入れ、`included`（取り込まれたときの通知）は特別に扱います。継承ではなく、部品の組み合わせで機能を増やせるようにする仕組みです。

## コード

```lua:line-numbers=109
local function _includeMixin(aClass, mixin)
  assert(type(mixin) == 'table', "mixin must be a table")

  for name,method in pairs(mixin) do
    if name ~= "included" and name ~= "static" then aClass[name] = method end
  end

  for name,method in pairs(mixin.static or {}) do
    aClass.static[name] = method
  end

  if type(mixin.included)=="function" then mixin:included(aClass) end
  return aClass
end
```

## 前提知識

- **mixin**: 機能のまとまりを 1 つのテーブルにしたものです。継承のように親子関係を作らず、必要なクラスに部品として足します。
- **`static`**: クラスそのものに属する関数です。インスタンスからは呼べず、`Class.名前` の形で使います。
- **`included`**: 部品がクラスに取り込まれたときに呼ばれる、特別な名前の関数です。取り込み時の準備に使います。
- **`assert`**: 条件が偽のときに止めるための関数です。ここでは、部品が表（テーブル）であることを確かめています。

## 何をしているか

### 1. 部品であることを確かめる

最初に、渡されたものがテーブルかを `assert` で確かめます。関数や数字を部品として渡すと、ここで止まります。

```lua:line-numbers=110
  assert(type(mixin) == 'table', "mixin must be a table")
```

### 2. 通常のメソッドをクラスに写す

`pairs(mixin)` で部品の中身を 1 つずつ見て、`included` と `static` 以外をクラスに写します。これで、インスタンスからも部品のメソッドが使えるようになります。

```lua:line-numbers=113
    if name ~= "included" and name ~= "static" then aClass[name] = method end
```

### 3. クラス用の関数は `static` の表へ

`mixin.static` があれば、その中身を `aClass.static` に写します。クラス用の関数は、インスタンスのメソッドと混ざらないように、別の場所に置きます。

```lua:line-numbers=116
  for name,method in pairs(mixin.static or {}) do
    aClass.static[name] = method
  end
```

### 4. 取り込まれたことを知らせる

`included` が関数であれば、`mixin:included(aClass)` を呼びます。部品が、取り込まれた先のクラスを知って準備できるようにするためです。

```lua:line-numbers=120
  if type(mixin.included)=="function" then mixin:included(aClass) end
```

## ここがすごい

- **名前の衝突を場所で分ける**: インスタンス用と、クラス用の関数を別の表に置くことで、同じ名前の関数が混ざらずに済みます。
- **通知の仕組みで準備を任せる**: `included` があれば、部品自身が取り込み時の処理を書けます。取り込む側が、部品の中身を知らなくてよくなります。
- **素直な書き方との比較**: 単に全部を `aClass` に写すと、クラス用の関数がインスタンスのメソッドとして呼べてしまい、不具合の原因になります。種類ごとに場所を分けるのが、この関数の要点です。
- **注意点**: 後から取り込んだ部品が、同じ名前のメソッドを上書きします。部品の順番と名前の衝突には注意が必要です。

## まとめ

- 部品を取り込むときは、インスタンス用とクラス用を分けて写すと、混ざらない。
- 部品に取り込み時の処理を書かせるには、`included` という通知の名前を決めておく。
- 継承ではなく部品の組み合わせにすると、機能を柔軟に増やせる。
