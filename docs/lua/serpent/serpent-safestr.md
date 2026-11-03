---
title: 文字列を安全な引用符つきの形にする safestr
description: Lua のシリアライズライブラリ serpent の safestr。数、文字列、その他の値を、出力用の安全な文字列に変えます。改行や特殊な文字を、読み込める形に直します。
language: lua
project: serpent
repo: https://github.com/pkulchenko/serpent
license: MIT
copyright: Copyright (c) 2012-2018 Paul Kulchenko
commit: "139fc18263bc5ffecc1729147891f1eb383046bf"
file: src/serpent.lua
lines: [26, 28]
format: 2
function: safestr
difficulty: 3
tags: [文字列処理, 防御的プログラミング, 正規表現]
---
## ひとことで

`safestr(s)` は、値 `s` を、Lua のコードとして読み込める安全な文字列の形に変える関数です。数は数として、文字列は引用符つきで、それ以外は `tostring` の結果として返します。改行などの扱いにくい文字も、読み込める形に直します。

## コード

:::: code-group

```lua:line-numbers=26 [日本語訳]
  local function safestr(s) return type(s) == "number" and (huge and snum[tostring(s)] or numformat:format(s))
    or type(s) ~= "string" and tostring(s) -- 改行（010）と EOF（026）を逃がす
    or ("%q"):format(s):gsub("\010","n"):gsub("\026","\\026") end
```

```lua:line-numbers=26 [原文]
  local function safestr(s) return type(s) == "number" and (huge and snum[tostring(s)] or numformat:format(s))
    or type(s) ~= "string" and tostring(s) -- escape NEWLINE/010 and EOF/026
    or ("%q"):format(s):gsub("\010","n"):gsub("\026","\\026") end
```

::::

## 前提知識

- **`%q` 書式**: 文字列を Lua のリテラルとして書ける形にする書式です。引用符や特殊な文字を、エスケープします。
- **`gsub` による追加の置き換え**: 改行の文字や、EOF の文字など、`%q` でも扱いにくい文字を、別の表記に置き換えます。
- **`numformat` と `snum`**: 数の表示の形を決める設定です。`huge` のような特別な値は、`snum` の表で扱います。
- **`and` と `or` の連なり**: 条件に応じて、数、文字列、その他の値の処理を選ぶための式です。

## 何をしているか

### 1. 数なら、数の書式で出す

値が数なら、特別な値の表か、数の書式で文字にします。文字列にはしません。

```lua:line-numbers=26
  local function safestr(s) return type(s) == "number" and (huge and snum[tostring(s)] or numformat:format(s))
```

### 2. 文字列なら、%q で引用符つきにし、特殊な文字を直す

値が文字列なら、`%q` で引用符つきの形にします。そのあとで、改行などの扱いにくい文字を、別の表記に置き換えます。

```lua:line-numbers=27
    or type(s) ~= "string" and tostring(s) -- escape NEWLINE/010 and EOF/026
    or ("%q"):format(s):gsub("\010","n"):gsub("\026","\\026") end
```

### 3. それ以外は、tostring の結果を使う

数でも文字列でもない値は、`tostring` で文字列にして返します。

```lua:line-numbers=27
    or type(s) ~= "string" and tostring(s) -- escape NEWLINE/010 and EOF/026
```

## ここがすごい

- **出力が読み込める**: 文字列の中の特殊な文字まで直すので、出力したコードを、そのまま読み込めます。
- **型ごとの扱いを一か所に**: 数、文字列、その他の値の扱いを、一つの式にまとめています。出力の形が、一貫して保たれます。
- **特別な数に対応**: 無限大などの値を、専用の表で表すので、読み込んだときに正しい値に戻せます。
- **注意点**: 読み込める形にするための置き換えは、Lua のバージョンに依存する部分があります。出力先の Lua の版を、事前に確かめてください。

## まとめ

- 出力を読み込める形にするには、型ごとの書き方を一か所にまとめると、出力の形が揃う。
- 扱いにくい文字は、読み込める別の表記に置き換えると、データを壊さずに済む。
- 特別な値は専用の表で扱うと、読み込んだときに意味を失わない。
