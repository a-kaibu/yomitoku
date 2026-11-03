---
title: クラスを関数のように呼ぶと、インスタンスが生まれる仕掛け
description: Lua の小さなクラス補助ライブラリ classic の __call。クラスのテーブルを関数として呼べるように metamethod を定義し、Dog(...) の一行でオブジェクトを作ります。
language: lua
project: classic
repo: https://github.com/rxi/classic
license: MIT
copyright: Copyright (c) 2014, rxi
commit: "e5610756c98ac2f8facd7ab90c94e1a097ecd2c6"
file: classic.lua
lines: [61, 65]
format: 2
function: Object:__call
difficulty: 2
tags: [メタプログラミング, 設計パターン, 関数型]
---

## ひとことで

`Object:__call(...)` は、クラスを `Dog(...)` のように関数として呼んだときに動く処理です。新しいテーブルを作り、クラスを metatable に設定して、`new` という初期化の関数を呼びます。そのあとで、できあがったオブジェクトを返します。`new` と `Dog(...)` の二通りの書き方を、1 つの仕組みでまとめています。

## コード

```lua:line-numbers=61
function Object:__call(...)
  local obj = setmetatable({}, self)
  obj:new(...)
  return obj
end
```

## 前提知識

- **`__call`**: metatable に入れておくと、そのテーブルを関数のように呼べるようにする特別な名前（metamethod）です。`t(1, 2)` と書くと、`t` の metatable の `__call` が `t, 1, 2` を受け取って動きます。
- **`setmetatable(t, mt)`**: テーブル `t` の metatable を `mt` にします。戻り値は `t` 自身です。
- **`...`（可変長引数）**: 関数に渡された引数すべてです。そのまま次の関数に渡せます。
- **`:`（コロンの呼び出し）**: `obj:new(...)` は `obj.new(obj, ...)` と同じ意味です。`obj` 自身を最初の引数 `self` として渡します。

## 何をしているか

### 1. 空のテーブルをクラスの子にする

`setmetatable({}, self)` で、中身が空のテーブルを作り、その metatable をクラス（`self`）にします。これで、このテーブルはクラスのメソッドを使えるインスタンスになります。

```lua:line-numbers=62
  local obj = setmetatable({}, self)
```

### 2. 初期化の関数 `new` を呼ぶ

`obj:new(...)` で、クラスに定義された `new` を呼びます。`Dog(...)` に渡した引数は、そのまま `new` に届きます。ユーザーは、オブジェクトの初期化を `new` に書くだけでよいことになります。

```lua:line-numbers=63
  obj:new(...)
```

### 3. できあがったオブジェクトを返す

`new` は戻り値を返す必要がありません。最後に作った `obj` を返すことで、`local d = Dog(...)` のように受け取れます。

```lua:line-numbers=64
  return obj
```

## ここがすごい

- **クラスを作る書き方が 1 つ減る**: `Dog.new(...)` と `Dog(...)` の両方が使えるように見えるので、呼び出す側はクラスの仕組みを意識せずに済みます。
- **初期化の責任が分かれている**: `__call` はオブジェクトを作るだけで、中身の準備は `new` に任せています。作る処理と準備する処理を別の関数にしたことで、子クラスは `new` だけを書き換えればよくなります。
- **言語の仕組みの応用**: Lua には `new` 演算子がありません。`__call` という metamethod を使うと、関数を呼ぶ構文そのものをクラスの生成に使えます。
- **注意点**: `new` が戻り値を返しても、`__call` はそれを使わず `obj` を返します。初期化の関数で値を返しても無視されるので、戻り値は書かないのが約束です。

## まとめ

- `__call` を定義すると、テーブルを関数のように呼んでオブジェクトを作れる。
- 「作る」と「準備する」を別の関数に分けると、子クラスの書き換えが楽になる。
- 可変長引数 `...` をそのまま渡すと、呼び出し側の引数が初期化の関数まで届く。
