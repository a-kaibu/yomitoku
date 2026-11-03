---
title: __pairs を無視して、テーブルの中身をそのまま回る
description: Lua のデバッグ表示ライブラリ inspect.lua の rawpairs。pairs と違って metatable の __pairs を使わず、テーブルの生の中身だけを順に返します。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [91, 93]
format: 2
function: rawpairs
difficulty: 1
tags: [メタプログラミング, データ構造, 防御的プログラミング]
---

## ひとことで

`rawpairs(t)` は、テーブルのキーと値を順に返すイテレータを作る関数です。`pairs` と似ていますが、metatable の `__pairs` を使いません。表示のときに、テーブルの本当の中身を見るために使われます。

## コード

```lua:line-numbers=91
local function rawpairs(t)
   return next, t, nil
end
```

## 前提知識

- **`pairs`**: テーブルのキーと値を順に返す標準関数です。Lua 5.2 以降では、metatable に `__pairs` があれば、その関数の結果を使います。
- **`next`**: テーブルの次のキーと値を返す基本の関数です。`pairs` はこれを使っています。
- **metatable と `__pairs`**: テーブルの振る舞いを変える仕組みです。`__pairs` を定義すると、`pairs` の中身を自分で決められます。
- **3 つ組のイテレータ**: `for` 文は `関数, 材料, 初期値` の 3 つで動きます。ここでは `next`、`t`、`nil` を返しています。

## 何をしているか

### 1. 基本の `next` を返す

`next` 関数と、対象の `t`、初期値 `nil` を返します。`for k, v in rawpairs(t)` と書くと、`next` が順にキーと値を返します。

```lua:line-numbers=92
   return next, t, nil
```


補足として、`rawpairs` が必要になるのは、表示する側が「テーブルの本当の形」を知りたいときです。普通のコードは `pairs` で十分ですが、ライブラリが他人のテーブルを表示するときは、`__pairs` が中身を隠したり作り変えたりしている可能性があります。そうしたものを、ありのまま見るために `rawpairs` を使います。


さらに、`rawpairs` と `pairs` の違いは、テストで確かめやすい点にもあります。同じテーブルを両方で回して結果が違えば、その差は metatable によるものだとすぐ分かります。

## ここがすごい

- **本当の中身を見る**: `__pairs` が中身を別の形に変えていても、`rawpairs` は生の中身を返します。表示が、ほかのコードの影響を受けません。
- **素のイテレータを使う**: 3 つ組をそのまま返すだけなので、小さくて速い関数です。
- **注意点**: `__index` などの仕組みも使わない読み方なので、仮想的な値は見えません。見たい値が metatable の中にあるなら、別の読み方が必要です。

## まとめ

- テーブルの生の中身を回りたいときは、`next` を使ったイテレータを返すと確実。
- `pairs` の振る舞いが変わる場合に備えて、表示のような処理では生の読み方を選ぶ。
