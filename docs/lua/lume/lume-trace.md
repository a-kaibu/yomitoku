---
title: デバッグ用に、呼び出し元の場所つきで表示する trace
description: Lua のユーティリティ集 lume の trace。デバッグ情報から、呼び出した場所のファイル名と行番号を取り出し、引数と一緒に表示します。数値は小数第 2 位までに丸めます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [659, 670]
format: 2
function: lume.trace
difficulty: 2
tags: [入出力, 標準ライブラリ, 可読性]
---
## ひとことで

`lume.trace(...)` は、渡された値を、呼び出した場所のファイル名と行番号つきで表示する関数です。`print` の代わりに使うと、どの行から出た表示かがすぐ分かります。数値は、読みやすいように小数第 2 位までに丸めて表示します。

## コード

```lua:line-numbers=659
function lume.trace(...)
  local info = debug.getinfo(2, "Sl")
  local t = { info.short_src .. ":" .. info.currentline .. ":" }
  for i = 1, select("#", ...) do
    local x = select(i, ...)
    if type(x) == "number" then
      x = string.format("%g", lume.round(x, .01))
    end
    t[#t + 1] = tostring(x)
  end
  print(table.concat(t, " "))
end
```

## 前提知識

- **`debug.getinfo`**: 実行中の関数の情報を取り出す標準関数です。第 2 引数の `2` は、ひとつ外側、つまり `trace` を呼んだ場所を指します。`"Sl"` は、ファイル名と行番号を求める指定です。
- **`short_src` と `currentline`**: 情報のうち、短いファイル名と、現在の行番号を表す項目です。
- **`%g` の書式**: 数を、見やすい形で表示する指定です。不要な 0 を省いて表します。
- **`lume.round`**: 数を丸める lume の関数です。ここでは `.01` を増分にして、小数第 2 位までに揃えています。

## 何をしているか

### 1. 呼び出し元の場所を先頭に置く

`debug.getinfo(2, "Sl")` で、呼び出した場所の情報を取り出します。ファイル名と行番号を、一つの文字列にして表の先頭に入れます。

```lua:line-numbers=660
  local info = debug.getinfo(2, "Sl")
  local t = { info.short_src .. ":" .. info.currentline .. ":" }
```

### 2. 引数を順に、文字列にする

引数を一つずつ取り出します。数なら、`lume.round` で丸めてから `%g` で書式を整えます。それ以外は `tostring` で文字列にします。

```lua:line-numbers=662
  for i = 1, select("#", ...) do
    local x = select(i, ...)
    if type(x) == "number" then
      x = string.format("%g", lume.round(x, .01))
    end
    t[#t + 1] = tostring(x)
  end
```

### 3. 空白で区切って表示する

すべての項目を、空白で区切って一行にまとめ、`print` で表示します。

```lua:line-numbers=669
  print(table.concat(t, " "))
```

## ここがすごい

- **場所がすぐ分かる**: 表示の先頭に、ファイル名と行番号が付くので、どの処理から出たかをすぐ追えます。
- **数の見やすさ**: 長い小数を、丸めて表示するので、デバッグのときに目が疲れません。
- **型を問わない**: 数でも文字でも、`tostring` で同じように表示できます。引数の種類を気にしなくてよいです。
- **注意点**: 行番号は、`trace` を呼んだ場所のものです。呼び出しを別の関数で包むと、包んだ側の行が出るので、level を変える必要があります。

## まとめ

- デバッグの表示には、呼び出し元の場所を付けると、どこから出たかをすぐ見つけられる。
- 値の種類ごとに表示の形を決めると、読みやすい出力になる。
- 呼び出しを包むと、場所の情報がずれるので、その層の数を意識する。
