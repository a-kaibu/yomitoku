---
title: NaN と無限大を自分自身との比較で見つける JSON の数値変換
description: JSON ライブラリ json.lua の encode_number。NaN は自分と等しくないという性質を使って見つけ、JSON で表せない値はエラーにして、残りを %.14g の形で書き出します。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [106, 112]
format: 2
function: encode_number
difficulty: 2
tags: [数値計算, 防御的プログラミング, 文字列処理]
---

## ひとことで

`encode_number(val)` は、Lua の数字を JSON の数字の文字列に変える関数です。JSON には NaN（数ではない値）や無限大を書く方法がないので、それらが来たらエラーにします。普通の数字は、有効桁 14 桁の `%.14g` という書式で文字にします。

## コード

::: code-group

```lua:line-numbers=106 [日本語訳]
local function encode_number(val)
  -- NaN、-inf、inf を確かめる
  if val ~= val or val <= -math.huge or val >= math.huge then
    error("unexpected number value '" .. tostring(val) .. "'")
  end
  return string.format("%.14g", val)
end
```

```lua:line-numbers=106 [原文]
local function encode_number(val)
  -- Check for NaN, -inf and inf
  if val ~= val or val <= -math.huge or val >= math.huge then
    error("unexpected number value '" .. tostring(val) .. "'")
  end
  return string.format("%.14g", val)
end
```

:::

## 前提知識

- **NaN（Not a Number）**: 0 を 0 で割ったような、数ではない値です。NaN は、自分自身とも等しくないという決まりがあります。
- **無限大（`math.huge`）**: Lua で、どんな数より大きい値を表す定数です。`-math.huge` は負の無限大です。
- **`string.format("%.14g", n)`**: 数を、有効数字 14 桁までの、必要な分だけの形で文字列にする書式です。`1.0` は `1` になり、長い小数は指数表記にもなります。
- **`or` の短絡評価**: 左側が真なら、右側は計算されません。

## 何をしているか

### 1. NaN は「自分と等しくない」で見つける

Lua の `val ~= val` は、値が NaN のときだけ `true` になります。普通の数字は必ず自分と等しいので、`false` です。特別な関数を呼ばずに NaN を見つけられる、ちょっとした裏技です。

```lua:line-numbers=108
  if val ~= val or val <= -math.huge or val >= math.huge then
```

### 2. 無限大は大小で見つける

`val <= -math.huge` と `val >= math.huge` で、負と正の無限大を見つけます。どちらかに当てはまれば、JSON として書けない値です。

### 3. エラーにするか、書式で文字にする

当てはまる値なら、`error` で、値の文字列とともに止めます。そうでなければ、`%.14g` の書式で文字列にして返します。

```lua:line-numbers=111
  return string.format("%.14g", val)
```

## ここがすごい

- **比較だけで NaN を判定できる**: `0/0 ~= 0/0` のように、NaN は自分自身と比べても等しくありません。`math.isnan` のような関数がなくても、この性質で見つけられます。
- **JSON の決まりを守る**: JSON の仕様では NaN と無限大は書けません。黙って別の値に変えず、エラーにして知らせることで、壊れたデータが出ていくのを防いでいます。
- **書式で見た目を整える**: `%.14g` は、整数なら小数点を付けず、長い小数は桁数を制限します。多くの値を扱うときに、出力が読みやすくなります。
- **注意点**: 有効数字 14 桁なので、それより細かい精度は失われます。精度がとても重要なデータでは、この点を考える必要があります。

## まとめ

- NaN は `val ~= val` で見つけられる。特別な関数を呼ばずに済む。
- 表せない値は黙って変換せず、エラーにして知らせる。
- 数の出力は書式を指定すると、見た目と精度を同時に決められる。
