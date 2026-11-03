---
title: クラスから子クラスを作り、メソッドを引き継ぐ subclass
description: Lua のクラスライブラリ middleclass の subclass。既存のクラスから子クラスを作り、親のメソッドを写して、初期化の処理も親に任せます。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [151, 168]
format: 2
function: subclass
difficulty: 2
tags: [設計パターン, メタプログラミング, クロージャ]
---
## ひとことで

`subclass(self, name)` は、既存のクラス `self` から、子クラスを作る関数です。親のメソッドを子に写し、子のインスタンスの初期化を親の `initialize` に任せます。子クラスを、親の仕組みをそのまま引き継いだ形で作るための関数です。

## コード

```lua:line-numbers=151
    subclass = function(self, name)
      assert(type(self) == 'table', "Make sure that you are using 'Class:subclass' instead of 'Class.subclass'")
      assert(type(name) == "string", "You must provide a name(string) for your class")

      local subclass = _createClass(name, self)

      for methodName, f in pairs(self.__instanceDict) do
        if not (methodName == "__index" and type(f) == "table") then
          _propagateInstanceMethod(subclass, methodName, f)
        end
      end
      subclass.initialize = function(instance, ...) return self.initialize(instance, ...) end

      self.subclasses[subclass] = true
      self:subclassed(subclass)

      return subclass
    end,
```

## 前提知識

- **クラスとインスタンス**: middleclass では、クラスも表です。インスタンスは、クラスのメソッドを探すための metatable を持ちます。
- **`__instanceDict`**: メソッドを集めておく表です。子クラスを作るときは、この表の中身を順に写します。
- **`_createClass`**: 新しいクラスの表を作る内部の関数です。子クラスの土台を、ここで作ります。
- **`subclassed`**: 子クラスが作られたときに呼ばれる、通知のための関数です。既定では何もしません。

## 何をしているか

### 1. 引数を確かめ、子クラスを作る

`self` が表であること、`name` が文字列であることを、`assert` で確かめます。そのうえで、`_createClass` で子クラスの土台を作ります。

```lua:line-numbers=152
      assert(type(self) == 'table', "Make sure that you are using 'Class:subclass' instead of 'Class.subclass'")
      assert(type(name) == "string", "You must provide a name(string) for your class")

      local subclass = _createClass(name, self)
```

### 2. 親のメソッドを子へ写す

親の `__instanceDict` を回し、メソッドを一つずつ子へ写します。`__index` が表のときは、写さずに飛ばします。表の参照は、子で別に扱うためです。

```lua:line-numbers=157
      for methodName, f in pairs(self.__instanceDict) do
        if not (methodName == "__index" and type(f) == "table") then
          _propagateInstanceMethod(subclass, methodName, f)
        end
      end
```

### 3. 初期化を親に任せて、登録する

子の `initialize` は、親の `initialize` を呼ぶ関数にします。そして、親の `subclasses` に子を登録し、`subclassed` を呼んで、子ができたことを知らせます。

```lua:line-numbers=162
      subclass.initialize = function(instance, ...) return self.initialize(instance, ...) end

      self.subclasses[subclass] = true
      self:subclassed(subclass)

```

### 4. 子クラスを返す

作った子クラスを返します。呼ぶ側は、その表を新しいクラスとして使えます。

```lua:line-numbers=167
      return subclass
```

## ここがすごい

- **親の仕組みをそのまま使う**: メソッドを写すだけで、子は親の振る舞いを引き継げます。コードを書き直す必要がありません。
- **初期化の連鎖**: 子の `initialize` が親を呼ぶので、親の初期化の処理も、子のインスタンスに対して働きます。
- **登録と通知**: 親が子の一覧を覚えるので、後から、すべての子クラスを探せます。`subclassed` は、拡張のための入口として残されています。
- **注意点**: 親のメソッドを後から変えても、すでに作られた子には、写したものが残ります。変更を子にも反映させたいときは、別の仕組みが必要です。

## まとめ

- 子クラスは、親のメソッドを写すことで、親の振る舞いを引き継げる。
- 初期化を親に任せると、親の準備の処理を、子で省かずに済む。
- 作った子を親が覚えておくと、後の処理で一覧を使える。
