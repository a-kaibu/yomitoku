---
title: 型が違うキーを混ぜても並べられる比較関数
description: Lua のデバッグ表示ライブラリ inspect.lua の sortKeys。数字、文字列、真偽値などが混ざったテーブルのキーを、決まった順番で並べ替えるための比較関数です。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [145, 163]
format: 2
function: sortKeys
difficulty: 2
tags: [ソート, 型システム, 可読性]
---

## ひとことで

`sortKeys(a, b)` は、テーブルのキーを並べ替えるときの比較関数です。Lua の `<` は、数字同士や文字列同士なら比べられますが、数字と文字列を比べるとエラーになります。この関数は型ごとに決まった順番を作り、どんな型のキーが混ざっていても必ず並べられるようにします。

## コード

```lua:line-numbers=145
local defaultTypeOrders = {
   ['number'] = 1, ['boolean'] = 2, ['string'] = 3, ['table'] = 4,
   ['function'] = 5, ['userdata'] = 6, ['thread'] = 7,
}

local function sortKeys(a, b)
   local ta, tb = type(a), type(b)


   if ta == tb and (ta == 'string' or ta == 'number') then
      return (a) < (b)
   end

   local dta = defaultTypeOrders[ta] or 100
   local dtb = defaultTypeOrders[tb] or 100


   return dta == dtb and ta < tb or dta < dtb
end
```

## 前提知識

- **比較演算子 `<`**: 2 つの値のどちらが小さいかを判定します。Lua では、同じ型の数字同士、同じ型の文字列同士なら比べられますが、違う型同士はエラーになります。
- **比較関数（comparator）**: `table.sort` などの並べ替えで、「a は b より前か」を答える関数です。`true` なら `a` を前に、`false` なら後ろに置きます。
- **`type(x)`**: 値の型を文字列で返します。`"number"`、`"string"`、`"table"` などです。
- **`or` と `and` の優先順位**: `and` は `or` より先に計算されます。この関数では、その性質を使って 1 行で判定を書いています。

## 何をしているか

### 1. 同じ型の数字・文字列は、値で比べる

両方の型が同じで、それが文字列か数字なら、値そのものを `<` で比べます。これが普通の並べ替えです。

```lua:line-numbers=154
   if ta == tb and (ta == 'string' or ta == 'number') then
      return (a) < (b)
   end
```

### 2. 違う型は、型の順番表で比べる

違う型や、表にない型（テーブルなど）の場合は、`defaultTypeOrders` の数字で型の順番を決めます。数字は `1`、真偽値は `2`、文字列は `3` の順です。表にない型は `100` として、いちばん後ろに置かれます。

```lua:line-numbers=158
   local dta = defaultTypeOrders[ta] or 100
   local dtb = defaultTypeOrders[tb] or 100
```

### 3. 型の順番が同じなら型名で、違えば順番で決める

最後の 1 行は、`dta == dtb and ta < tb or dta < dtb` という形です。`dta == dtb`（順番が同じ）のときは `ta < tb` で型名を比べ、そうでなければ `dta < dtb` で順番を比べます。`and` と `or` の組み合わせで、この 2 段階の判定を 1 行にしています。

```lua:line-numbers=162
   return dta == dtb and ta < tb or dta < dtb
```

## ここがすごい

- **どんなキーでも必ず並ぶ**: 型が混ざったキーで普通に `<` を使うとエラーになります。型ごとの順番を用意すれば、どの組み合わせでも比較の答えが 1 つに決まります。
- **表示が毎回同じになる**: 並べ替えの結果が決まっていると、`inspect` の出力も毎回同じ順番になります。テストで出力を比べるときに、この安定性が役立ちます。
- **表にない型への備え**: `or 100` の一手で、表にない型（テーブルや関数の一部など）が来ても、エラーにならず後ろに回ります。
- **注意点**: 型が同じで数字も文字列でもない場合（テーブル同士など）は、`ta < tb` の比較が型名同士の比較になるので、同じ型の中では順番が決まりません。この関数はそこまでは並べません。

## まとめ

- 型が混ざる値を並べるときは、型ごとの順番表を用意すると、エラーを避けられる。
- `and` と `or` の組み合わせで、2 段階の比較を 1 行で書ける。
- 表にない値には既定の順番（ここでは `100`）を与えて、必ず比較できるようにする。
