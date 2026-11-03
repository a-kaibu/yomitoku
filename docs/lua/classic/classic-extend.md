---
title: テーブルの複製と metatable の鎖で「継承」を作る
description: Lua の小さなクラス補助ライブラリ classic の extend。親のメソッドのうち「__」で始まるものだけを新しいクラスにコピーし、metatable で親とつなぎます。
language: lua
project: classic
repo: https://github.com/rxi/classic
license: MIT
copyright: Copyright (c) 2014, rxi
commit: "e5610756c98ac2f8facd7ab90c94e1a097ecd2c6"
file: classic.lua
lines: [19, 30]
format: 2
function: Object:extend
difficulty: 3
tags: [メタプログラミング, 設計パターン, データ構造]
---

## ひとことで

`Object:extend()` は、今あるクラスから「子クラス」を作る関数です。Lua には `class` という言語機能がないので、テーブルと metatable（テーブルの振る舞いを決める別のテーブル）の組み合わせで、継承に相当する仕組みを作っています。親の特別なメソッド（`__` で始まるもの）だけを子にコピーし、残りは親を通して探せるようにします。

## コード

```lua:line-numbers=19
function Object:extend()
  local cls = {}
  for k, v in pairs(self) do
    if k:find("__") == 1 then
      cls[k] = v
    end
  end
  cls.__index = cls
  cls.super = self
  setmetatable(cls, self)
  return cls
end
```

## 前提知識

- **テーブル**: Lua のデータ構造です。`{}` で作り、キーと値を持ちます。クラスも、インスタンスも、ただのテーブルです。
- **metatable**: あるテーブルに `setmetatable(t, mt)` で付ける「裏のテーブル」です。`t` に存在しないキーを探すとき、`mt` の `__index` を見に行きます。
- **`__index`**: 存在しないキーを探したときに、どこを見るかを決める特別なキーです。ここでは `cls.__index = cls` とすることで、子のインスタンスに足りないメソッドを子クラスから探させます。
- **`__` で始まる名前**: Lua では `__index`、`__tostring`、`__call` のように、`__` で始まるキーが演算の振る舞いを決めます。これらは継承されないと困るものです。

## 何をしているか

### 1. `__` で始まるメソッドだけをコピーする

`pairs(self)` で親のキーを 1 つずつ見て、`k:find("__") == 1` のものだけを子に写します。`find` が `1` を返すのは、名前の先頭に `__` がある場合だけです。

```lua:line-numbers=21
  for k, v in pairs(self) do
    if k:find("__") == 1 then
      cls[k] = v
    end
  end
```

`__tostring` や `__call` は、親の振る舞いを子でも使うために、コピーしておく必要があります。

### 2. 子のインスタンスが子クラスを見るようにする

`cls.__index = cls` と書くと、子のインスタンスに存在しないキーを探したとき、子クラスの中を見に行きます。

```lua:line-numbers=26
  cls.__index = cls
```

### 3. 親を記録し、metatable で親とつなぐ

`cls.super = self` で親を覚えておきます。`setmetatable(cls, self)` は、子クラスに存在しないキーがあれば親を見る、という鎖を作ります。これで親のメソッドも、子から呼べるようになります。

```lua:line-numbers=27
  cls.super = self
  setmetatable(cls, self)
  return cls
```

## ここがすごい

- **言語機能に頼らず継承を作る**: Lua にはクラスの構文がありません。テーブルと metatable だけで、親子関係、メソッドの探索、`__` 演算子の継承を実現しています。
- **全部をコピーしない工夫**: 普通のメソッドは metatable の鎖で親から探せるので、コピーは必要ありません。コピーするのは、演算子として使われる `__` の名前だけです。これで、子を作る処理が最小限になります。
- **`__index` を自分自身にする**: 子のインスタンスの検索先を子クラスにしているので、インスタンス → 子クラス → 親クラス、という 3 段の探索が自然につながります。
- **トレードオフ**: 親のメソッドを後から変えても、コピーされた `__` のメソッドは古いままになります。これは `__` 以外のメソッドには当てはまらないので、この設計の既知の制限です。

## まとめ

- Lua の継承は、metatable の `__index` を鎖状につなぐと作れる。
- 演算子に相当する `__` のメソッドだけをコピーすると、子を作る処理が短くなる。
- 親を `super` として覚えておくと、上書きしたメソッドから親を呼び出せる。
