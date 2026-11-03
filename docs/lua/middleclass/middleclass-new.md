---
title: 作って初期化して返す new、allocate との組み合わせ
description: Lua のクラスライブラリ kikito/middleclass の new。allocate で空のインスタンスを作り、initialize を呼んでから返します。クラスからインスタンスを作る、一般的な入口です。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [144, 149]
format: 2
function: new
difficulty: 2
tags: [設計パターン, メタプログラミング, クロージャ]
---
## ひとことで

`new(self, ...)` は、クラスからインスタンスを作る入口の関数です。まず `allocate` で空のインスタンスを作り、次に `initialize` を、渡された引数で呼びます。最後にインスタンスを返します。利用者は、`MyClass:new(1, 2)` のように書くだけで、作る処理と初期化が続けて行われます。

## コード

```lua:line-numbers=144
    new = function(self, ...)
      assert(type(self) == 'table', "Make sure that you are using 'Class:new' instead of 'Class.new'")
      local instance = self:allocate()
      instance:initialize(...)
      return instance
    end,
```

## 前提知識

- **`allocate` と `initialize` の役割**: `allocate` は、器だけを作ります。`initialize` は、その器に値を入れる、利用者が書く関数です。`new` は、この二つを順に呼びます。
- **`self:allocate()`**: `self` を通して `allocate` を呼びます。子クラスで `allocate` を上書きすれば、作り方を変えられます。
- **可変長の引数 `...`**: `new` が受け取った引数を、そのまま `initialize` に渡します。利用者の引数が、欠けずに届きます。
- **`instance:initialize(...)`**: インスタンスのメソッドとして `initialize` を呼びます。`self` は、作ったばかりのインスタンスになります。

## 何をしているか

### 1. クラスから呼ばれたかを確かめる

`self` が表であるかを確かめます。違えば、`Class:new` の書き方を促すエラーにします。

```lua:line-numbers=145
      assert(type(self) == 'table', "Make sure that you are using 'Class:new' instead of 'Class.new'")
```

### 2. 空のインスタンスを作って、初期化する

`self:allocate()` で器を作り、`instance:initialize(...)` で、渡された引数を使って値を入れます。

```lua:line-numbers=146
      local instance = self:allocate()
      instance:initialize(...)
```

### 3. 作ったインスタンスを返す

初期化の済んだインスタンスを、そのまま返します。呼ぶ側は、これを変数に受け取って使います。

```lua:line-numbers=148
      return instance
```

## ここがすごい

- **書き方が一つにまとまる**: 作る処理と初期化を、一つの呼び出しにまとめています。利用者は、迷わずに使えます。
- **差し替えやすい**: `allocate` や `initialize` を、子クラスで個別に書き換えられます。新しい作り方を、既存の流れに組み込めます。
- **引数が欠けない**: 可変長の引数をそのまま渡すので、どんな初期化の引数にも対応できます。
- **注意点**: `initialize` が書かれていなければ、既定の空の関数が呼ばれます。その場合、インスタンスには値が入りません。

## まとめ

- 作る処理と初期化を、一つの入口にまとめると、利用者の書き方が統一される。
- 中の部品を別の関数に分けておくと、子クラスごとに差し替えられる。
- 可変長の引数をそのまま渡すと、初期化の仕様を変えても入口は変わらない。
