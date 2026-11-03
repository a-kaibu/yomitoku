---
title: 初期化せずに、空のインスタンスを作る allocate
description: Lua のクラスライブラリ kikito/middleclass の allocate。コンストラクタを呼ばずに、クラスの metatable を持つ空の表だけを作ります。new の前半にあたる処理です。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [139, 142]
format: 2
function: allocate
difficulty: 2
tags: [設計パターン, メタプログラミング, 防御的プログラミング]
---
## ひとことで

`allocate(self)` は、クラスのインスタンスを、初期化せずに作る関数です。空の表を作り、そのクラスの `__instanceDict` を metatable として付けるだけです。`new` が行う「作る」と「初期化する」の、前半だけを担当します。

## コード

```lua:line-numbers=139
    allocate = function(self)
      assert(type(self) == 'table', "Make sure that you are using 'Class:allocate' instead of 'Class.allocate'")
      return setmetatable({ class = self }, self.__instanceDict)
    end,
```

## 前提知識

- **`__instanceDict`**: クラスのメソッドを集めた表で、インスタンスの metatable になります。これを通して、インスタンスはクラスのメソッドを使えます。
- **`setmetatable`**: 表に metatable を付ける標準関数です。作った表に、クラスの振る舞いを与えます。
- **`class` の鍵**: 作ったインスタンスには、`class` という鍵で、属しているクラスを入れておきます。`tostring` などで使われます。
- **`assert` による確認**: `self` が表であることを確かめ、クラス以外から呼ばれた場合にエラーにします。

## 何をしているか

### 1. クラスから呼ばれたかを確かめる

`self` が表であるかを確かめます。表でなければ、`Class:allocate` と書くべきところを、`Class.allocate` と書いた誤りだと伝えます。

```lua:line-numbers=140
      assert(type(self) == 'table', "Make sure that you are using 'Class:allocate' instead of 'Class.allocate'")
```

### 2. 空の表を作り、クラスを結び付ける

`{ class = self }` で、クラスを覚えた空の表を作ります。`setmetatable` で、その表に `self.__instanceDict` を metatable として付けて、返します。

```lua:line-numbers=141
      return setmetatable({ class = self }, self.__instanceDict)
```

## ここがすごい

- **初期化と分けられる**: 作ることと、値を入れることを分けているので、初期化を省いて作る場面にも使えます。
- **クラスを鍵で覚える**: `class` の鍵で、インスタンスが属するクラスを確かめられます。型の判定にも役立ちます。
- **誤用を早く知らせる**: 呼び出し方の間違いを、わかりやすい文章で伝えます。原因を見つけやすくなります。
- **注意点**: 初期化を省くので、`initialize` で設定される値は入りません。使う側で、必要な値を補う必要があります。

## まとめ

- 作ることと初期化を分けると、目的に応じて組み合わせられる。
- インスタンスにクラスを覚えさせると、後から型を確かめられる。
- 呼び出し方の誤りは、わかりやすく伝えると、利用者が直しやすい。
