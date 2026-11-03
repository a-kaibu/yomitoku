---
title: 親クラスを直したら、子クラスにも自動で届かせる仕組み
description: Lua のクラスライブラリ middleclass の _propagateInstanceMethod。メソッドを書き換えると、子クラスのうち自分で定義していない場合に限って、その変更を再帰的に配り直します。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [57, 66]
format: 2
function: _propagateInstanceMethod
difficulty: 3
tags: [メタプログラミング, 設計パターン, 再帰]
---

## ひとことで

`_propagateInstanceMethod` は、クラスのメソッドが変わったとき、その変更を子クラスへ配り直す内部関数です。子クラスが自分で同じ名前のメソッドを定義している場合は、その定義を尊重して変更を届けません。Lua のクラスで「親の変更が子に伝わる」ように見せるための中心となる処理です。

## コード

```lua:line-numbers=57
local function _propagateInstanceMethod(aClass, name, f)
  f = name == "__index" and _createIndexWrapper(aClass, f) or f
  aClass.__instanceDict[name] = f

  for subclass in pairs(aClass.subclasses) do
    if rawget(subclass.__declaredMethods, name) == nil then
      _propagateInstanceMethod(subclass, name, f)
    end
  end
end
```

## 前提知識

- **`__instanceDict`**: middleclass が、インスタンスの検索に使うメソッドを集めておくテーブルです。インスタンスからメソッドを探すとき、ここを見に行きます。
- **`rawget`**: metatable の仕組みを通さずに、テーブルの値を直接取り出す関数です。`__index` などの特別な処理を飛ばして、そのテーブルに本当にある値だけを見られます。
- **再帰呼び出し**: 関数が自分自身を呼ぶ書き方です。ここでは、子クラスの子クラスへと同じ処理を広げるために使われています。
- **`__index`**: 存在しないキーを探したときの動きを決める特別な名前です。middleclass では、これだけ特別に包み直してから配ります。

## 何をしているか

### 1. 届けるメソッドを用意する

`name == "__index"` のときだけ、`_createIndexWrapper` で関数を包み直します。他の名前のメソッドは、そのまま `f` を使います。`and` と `or` の組み合わせで、1 行で条件分岐をしています。

```lua:line-numbers=58
  f = name == "__index" and _createIndexWrapper(aClass, f) or f
```

### 2. このクラスのインスタンス用の表に入れる

包んだメソッドを `aClass.__instanceDict` に入れます。これで、このクラスのインスタンスは、この新しいメソッドを使えるようになります。

```lua:line-numbers=59
  aClass.__instanceDict[name] = f
```

### 3. 子クラスへ、再帰的に配る

`aClass.subclasses` の子クラスを 1 つずつ見ます。子が `__declaredMethods`（自分で定義したメソッドの表）にその名前を持っていなければ、子にも同じ関数を届けます。届けた先の子でも、同じ処理が続きます。

```lua:line-numbers=61
  for subclass in pairs(aClass.subclasses) do
    if rawget(subclass.__declaredMethods, name) == nil then
      _propagateInstanceMethod(subclass, name, f)
    end
  end
```

`rawget` は、metatable を通さずにテーブルそのものだけを見る関数です。「子が自分で定義したメソッド」だけを調べたいので、継承の仕組みを経由しない `rawget` を使っています。

## ここがすごい

- **変更が自然に届く**: 親のメソッドを後から差し替えても、子はそれを自動で使えます。コピーを作って回るのではなく、表を書き換えて届ける方法です。
- **子の上書きを守る**: 子が自分でメソッドを定義していれば、親の変更で壊されません。`rawget` で「本当に自分で定義したか」を確かめるところに、この設計の要点があります。
- **再帰で階層を任せる**: 子の子まで同じ関数が自動で広がるので、継承の深さを気にせずに済みます。
- **トレードオフ**: 子クラスが多いと、変更のたびに全部を走査します。頻繁に変わるメソッドより、クラスを作るときに一度だけ決まるメソッドに向いた仕組みです。

## まとめ

- 親の変更を子に届けるときは、子が自分で定義しているかを `rawget` で確かめる。
- 再帰呼び出しを使うと、子の子まで同じ処理を一箇所に書けて済む。
- `and` と `or` で、特別な名前だけを包み直す分岐を 1 行で書ける。
