---
title: 表の値を一括で文字列に変換する array_tostring
description: Lua のユーティリティ集 Penlight の utils.array_tostring。配列の各要素を、tostring などの変換関数で文字列にして、新しい表に並べます。バッファを渡せば、表の再利用もできます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [157, 163]
format: 2
function: utils.array_tostring
difficulty: 1
tags: [文字列処理, イテレータ, 最適化]
---
## ひとことで

`utils.array_tostring(t, temp, tostr)` は、配列 `t` の各要素を、文字列に変換して並べた表を返す関数です。変換には `tostr` を使い、省略すると `tostring` を使います。`temp` を渡すと、その表を結果の入れ物として再利用します。配列の内容を、ひとまとめに文字列へ直すときに使えます。

## コード

```lua:line-numbers=157
function utils.array_tostring (t,temp,tostr)
    temp, tostr = temp or {}, tostr or tostring
    for i = 1,#t do
        temp[i] = tostr(t[i],i)
    end
    return temp
end
```

## 前提知識

- **`tostring`**: 値を人が読める文字列に変換する標準関数です。どの型の値でも、文字列にできます。
- **関数を引数に渡す**: Lua では関数も値なので、変換の方法を引数として差し替えられます。ここでは、`tostr` がその役目です。
- **バッファ（temp）**: 結果を入れるための表です。使い回せば、毎回新しい表を作る手間を省けます。
- **`#t`**: 配列の長さです。この長さの回数だけ、変換を繰り返します。

## 何をしているか

### 1. 入れ物と変換の方法を決める

`temp` と `tostr` が省略されていれば、空の表と `tostring` を使います。渡されていれば、それをそのまま使います。

```lua:line-numbers=158
    temp, tostr = temp or {}, tostr or tostring
```

### 2. 配列を先頭から変換する

`for i = 1, #t` で、各要素を `tostr(t[i], i)` で文字列にし、`temp[i]` に入れます。変換の関数には、値と番号の両方を渡しています。

```lua:line-numbers=159
    for i = 1,#t do
        temp[i] = tostr(t[i],i)
    end
```

### 3. 結果の表を返す

変換の結果を入れた `temp` を返します。`temp` を渡さなかった場合は、新しく作られた表が返ります。

```lua:line-numbers=162
    return temp
```

## ここがすごい

- **変換を外から選べる**: `tostr` を差し替えれば、数の書式や、引用符つきの表示など、用途に応じた文字列を作れます。
- **番号も渡す**: 変換の関数は、要素の番号も受け取れます。番号によって、表示を変えるような使い方もできます。
- **再利用できるバッファ**: `temp` を使い回すと、大量の変換を繰り返すときに、表の作成の回数を減らせます。
- **注意点**: 配列の長さだけを回るので、キーが飛んでいる表は途中で止まります。連想配列を渡すと、想定の結果になりません。

## まとめ

- 変換の方法を引数にすると、同じ関数で、用途の違う文字列を作れる。
- 結果の入れ物を渡せる作りにすると、繰り返しの処理で表の作成を減らせる。
- 配列の長さで回る関数は、配列以外の表に使わないように注意する。
