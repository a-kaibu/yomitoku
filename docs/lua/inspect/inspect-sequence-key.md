---
title: 配列の部分かどうかを、キーの数字だけで判定する
description: Lua のデバッグ表示ライブラリ inspect.lua の isSequenceKey。キーが 1 から配列の長さまでの整数かを調べ、配列として表示すべき要素を見分けます。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [137, 143]
format: 2
function: isSequenceKey
difficulty: 1
tags: [データ構造, 型システム, 可読性]
---

## ひとことで

`isSequenceKey(k, sequenceLength)` は、テーブルのキー `k` が「配列の部分」に入るかを判定する関数です。`1` から `sequenceLength` までの整数であれば `true` を返します。`inspect` はこの判定を使って、`{1, 2, 3, x = 4}` の `1〜3` を `[1]`、`[2]`、`[3]` ではなく、並んだ値として表示します。

## コード

```lua:line-numbers=137
local flr = math.floor
local function isSequenceKey(k, sequenceLength)
   return type(k) == "number" and
   flr(k) == k and
   1 <= (k) and
   k <= sequenceLength
end
```

## 前提知識

- **配列（sequence）**: Lua では、`1` から始まる連続した整数のキーを持つテーブルを配列として使うのが一般的です。`{ "a", "b" }` は `[1] = "a"`、`[2] = "b"` と同じです。
- **`math.floor`**: 小数を切り捨てて、整数にする関数です。`flr(k) == k` は、「`k` が整数か」を調べる定番の書き方です。
- **`sequenceLength`**: 配列の長さです。`#t` で求められ、連続した部分の最後の番号を表します。
- **`and` の短絡評価**: `and` の左側が `false` なら、右側は計算されません。型が数字でないキーに `flr` をかけずに済むのは、この性質のおかげです。

## 何をしているか

### 1. 数字であることを確かめる

まず `type(k) == "number"` で、キーが数字かを見ます。文字列のキー（`x = 4` の `"x"`）は、ここで `false` になり、後の判定は行われません。

```lua:line-numbers=139
   return type(k) == "number" and
```

### 2. 整数であることを確かめる

`flr(k) == k` は、小数の切り捨てた値が元の値と同じかを見ます。`2` は `2` と等しいので整数、`2.5` は `2` と等しくないので小数だとわかります。

```lua:line-numbers=140
   flr(k) == k and
```

### 3. 範囲にあることを確かめる

`1 <= k` と `k <= sequenceLength` で、キーが配列の最初と最後の間にあるかを見ます。両方が真なら、このキーは配列の一部です。

```lua:line-numbers=141
   1 <= (k) and
   k <= sequenceLength
```

## ここがすごい

- **条件を順番に絞る**: 型、整数、範囲の順に調べるので、後の条件は前の条件が通ったときだけ動きます。数字でないキーに `flr` をかける心配がありません。
- **整数の判定が一行で済む**: `flr(k) == k` は、「整数かどうか」を確かめる短い書き方です。小数の切り捨てと比べるだけなので、文字列に変換する方法より単純になります。
- **表示の見た目が決まる**: 配列の部分と、それ以外のキーを分けることで、`{1, 2, x = 4}` を読みやすい順番で表示できます。判定の結果が、そのまま表示の形を決めています。
- **注意点**: `sequenceLength` が正しくないと、判定が外れます。たとえば途中に穴があるテーブルでは、`#t` の値に依存するため、配列でないキーが混ざることがあります。

## まとめ

- 配列の部分の判定は、型・整数・範囲の順に条件を重ねると確実になる。
- `flr(k) == k` で整数かどうかを一行で確かめられる。
- `and` は左から順に評価され、途中で `false` なら後ろは計算されないので、安全な順番で書くことが大切。
