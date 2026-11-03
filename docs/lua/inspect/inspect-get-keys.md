---
title: 配列の続きと、それ以外のキーを分けて並べる
description: Lua のデバッグ表示ライブラリ inspect.lua の getKeys。1 から続く配列の長さを先に数え、残りのキーだけを並べ替えて返します。表示の順番を毎回同じにするための処理です。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [165, 182]
format: 2
function: getKeys
difficulty: 2
tags: [ソート, データ構造, 可読性]
---

## ひとことで

`getKeys(t)` は、テーブルを表示するときに、「配列として並べる部分の長さ」と「それ以外のキーの一覧」を返す関数です。`{"a", "b", x = 1, y = 2}` なら、配列の長さは `2` で、キーは `x` と `y` だけになります。配列の部分は番号順に表示し、残りは決まった順番で並べることで、表示結果がいつも同じになります。

## コード

```lua:line-numbers=165
local function getKeys(t)

   local seqLen = 1
   while _rawget(t, seqLen) ~= nil do
      seqLen = seqLen + 1
   end
   seqLen = seqLen - 1

   local keys, keysLen = {}, 0
   for k in rawpairs(t) do
      if not isSequenceKey(k, seqLen) then
         keysLen = keysLen + 1
         keys[keysLen] = k
      end
   end
   table.sort(keys, sortKeys)
   return keys, keysLen, seqLen
end
```

## 前提知識

- **`rawget` と `rawpairs`**: metatable の仕組みを通さずに、テーブルの中身だけを見る関数です。`inspect` は、表示のときに他のテーブルの影響を受けないように、この方法でキーを読みます。`_rawget` はその `rawget` の別名です。
- **`table.sort`**: 配列を並べ替える標準関数です。2 番目の引数に比較関数（`sortKeys`）を渡すと、その基準で並べます。
- **`isSequenceKey`**: キーが `1` から `seqLen` の間の整数かを調べる関数です。配列として表示される部分を見分けるために使われます。
- **`seqLen`**: 配列として連続している長さです。`1` から順に値があるかを、見つかるまで数えています。

## 何をしているか

### 1. 配列として続く長さを数える

`_rawget(t, seqLen)` が `nil` になるまで、`seqLen` を 1 ずつ増やします。最後に `1` を引くと、値が続いている最後の番号が残ります。

```lua:line-numbers=167
   local seqLen = 1
   while _rawget(t, seqLen) ~= nil do
      seqLen = seqLen + 1
   end
   seqLen = seqLen - 1
```

たとえば `{"a", "b", nil, "d"}` なら、`seqLen` は `2` になります。`3` で値がなくなるので、`4` の `"d"` は配列の続きには入りません。

### 2. 配列の部分以外のキーを集める

`rawpairs(t)` でキーを 1 つずつ見て、`isSequenceKey` が偽になるもの（配列の続きでないもの）だけを `keys` に入れます。`keysLen` は、その数を数えています。

```lua:line-numbers=173
   local keys, keysLen = {}, 0
   for k in rawpairs(t) do
      if not isSequenceKey(k, seqLen) then
         keysLen = keysLen + 1
         keys[keysLen] = k
      end
   end
```

### 3. 残りのキーを並べて返す

`table.sort(keys, sortKeys)` で、型の順番を考えた `sortKeys` の基準で並べ替えます。そして、キーの一覧、その数、配列の長さの 3 つを返します。

```lua:line-numbers=180
   table.sort(keys, sortKeys)
   return keys, keysLen, seqLen
```

## ここがすごい

- **配列の部分を先に切り出す**: 配列の番号は、キーの一覧とは別に扱います。`{"a", "b", x = 1}` を `1, 2, x` の順に並べるのは、この分け方のおかげです。
- **順番が毎回同じ**: `pairs` の順番は決まっていません。そのまま表示すると、実行のたびに出力が変わることがあります。並べ替えを入れることで、テストで出力を比べられます。
- **素直な書き方との比較**: 全部のキーを 1 つのリストにして並べると、配列の `1, 2, 3` が `"x"` より後ろに来たり、番号の順番が崩れたりします。配列の部分を分けることで、この問題を防いでいます。
- **注意点**: 穴のある配列では、`seqLen` は穴の手前で止まります。穴より後ろの数字キーは、キーの一覧に入り、`sortKeys` の基準で並びます。

## まとめ

- 表示用に並べるときは、配列の続く部分とそれ以外を分けると、読みやすく安定した順番になる。
- 値の有無を `nil` の確認で 1 つずつ見れば、配列の長さを安全に数えられる。
- `pairs` の順番に頼らず、並べ替えを入れると出力が毎回同じになる。
