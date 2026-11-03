---
title: 型ごとに関数の作り方を登録する、add_function_factory
description: Lua のユーティリティ集 Penlight の utils.add_function_factory。ある metatable を持つ値を、どの関数に変換するかを登録します。登録しておくと、その型の値を関数として使えるようになります。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [778, 780]
format: 2
function: utils.add_function_factory
difficulty: 2
tags: [メタプログラミング, 設計パターン, 関数型]
---
## ひとことで

`utils.add_function_factory(mt, fun)` は、ある metatable `mt` を持つ値を、関数に変換する方法を登録する関数です。登録された変換は、`utils.function_arg` などが、その型の値を関数として扱うときに使います。自分で作った型を、関数の引数として自然に渡せるようにするための仕組みです。

## コード

```lua:line-numbers=778
function utils.add_function_factory (mt,fun)
    _function_factories[mt] = fun
end
```

## 前提知識

- **metatable による型の印**: Lua では、値の振る舞いを決める metatable を、型の目印として使う慣習があります。同じ metatable の値は、同じ種類とみなせます。
- **工場（factory）**: 値を受け取り、新しい関数を作る関数のことです。ここでは、その型の値から、呼び出せる関数を作る役目を持ちます。
- **登録の表 `_function_factories`**: 登録された `mt` と工場の関係を、覚えておく表です。`mt` をキーにして、工場を引けるようにしています。
- **`function_arg`**: 引数を関数として扱うための Penlight の関数です。関数、文字列、呼び出せる表などを、関数に変えて返します。

## 何をしているか

### 1. metatable をキーにして工場を覚える

`_function_factories[mt] = fun` で、metatable `mt` に対応する工場 `fun` を、内部の表に登録します。

```lua:line-numbers=779
    _function_factories[mt] = fun
```

### 2. 後で、関数への変換に使われる

登録した工場は、`function_arg` が呼び出し可能でない表を受け取ったときに使われます。その表の metatable を調べて、登録された工場があれば、関数に変換してもらいます。

## ここがすごい

- **型ごとの振る舞いを外から足せる**: 既存の関数を書き換えずに、新しい型の扱い方を登録できます。拡張に強い作りです。
- **metatable をキーにする**: 型の判定を、特別な仕組みなしで行えます。同じ metatable を共有する値は、同じ工場を使います。
- **一行の登録**: 登録は表への代入だけです。短い関数で、仕組みの中身が完全に見えます。
- **注意点**: 同じ `mt` に二度登録すると、後の工場で上書きされます。登録の順番と、重複には注意してください。

## まとめ

- 型ごとの振る舞いを外から追加するには、metatable をキーにした登録の表が便利である。
- 拡張の仕組みは、既存の関数を変えずに済むように作ると、後の変更に強くなる。
- 登録の重なりは、上書きされることを前提に、一か所で管理する。
