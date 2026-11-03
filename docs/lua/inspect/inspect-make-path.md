---
title: 循環を辿る経路を、元を壊さずに 1 つ延ばす
description: Lua のデバッグ表示ライブラリ inspect.lua の makePath。今までの経路の配列を複製し、新しいキーを 2 つ末尾に足します。元の経路は変わらないので、枝分かれした探索でも安全です。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [201, 210]
format: 2
function: makePath
difficulty: 2
tags: [データ構造, 再帰, 防御的プログラミング]
---

## ひとことで

`makePath(path, a, b)` は、表示の経路（どのキーをたどって今の場所に来たか）を表す配列を受け取り、その末尾に 2 つの値を足した新しい配列を返します。元の経路は変えません。表示の途中で、枝ごとに別々の経路を持つために使われます。

## コード

```lua:line-numbers=201
local function makePath(path, a, b)
   local newPath = {}
   local len = #path
   for i = 1, len do newPath[i] = path[i] end

   newPath[len + 1] = a
   newPath[len + 2] = b

   return newPath
end
```

## 前提知識

- **経路（path）**: テーブルの中の場所を、キーの列で表したものです。`{"a", "b"}` は `t.a.b` の場所を表します。
- **配列の複製**: `for` で 1 つずつ写すことで、元と新しい配列が別々になります。
- **`#path`**: 配列の長さです。

## 何をしているか

### 1. 元の経路を新しい配列に写す

`newPath` は空の配列です。`for i = 1, len` で元の経路の値を 1 つずつ写します。これで、新しい配列を変えても元は影響を受けません。

```lua:line-numbers=204
   for i = 1, len do newPath[i] = path[i] end
```

### 2. 末尾に 2 つの値を足す

`a` と `b` を、元の長さの次の位置に入れます。「経路の末尾に、キーを 2 つ足す」という形になっています。

```lua:line-numbers=206
   newPath[len + 1] = a
   newPath[len + 2] = b
```

## ここがすごい

- **元を壊さない**: 経路は、枝ごとに別々の配列を持てます。ある枝の変更が、ほかの枝に影響しません。
- **枝の分かれ道に強い**: 循環の検出や、同じ値の繰り返しの表示で、経路を分岐させて扱えます。
- **注意点**: 経路が長いと、そのたびに配列を写すので、コピーの回数が増えます。深い構造では、そのコストを意識してください。

## まとめ

- 経路のような状態は、変更せずに新しい配列を作ると、枝ごとに安全に扱える。
- 配列の末尾に値を足す処理は、元の長さを使って決める。
