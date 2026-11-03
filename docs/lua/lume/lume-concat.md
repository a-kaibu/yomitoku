---
title: 複数の表を、順番に一本の配列へつなぐ concat
description: Lua のユーティリティ集 lume の concat。引数の表の要素を、順番どおりに 1 本の配列へ連ねます。nil の引数は飛ばすので、途中に欠けがあっても続けられます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [361, 373]
format: 2
function: lume.concat
difficulty: 2
tags: [データ構造, イテレータ, 防御的プログラミング]
---
## ひとことで

`lume.concat(...)` は、渡された複数の表を、先頭から順につないで 1 本の配列にする関数です。引数に `nil` が混ざっていたら、その引数は飛ばします。複数のリストを一つにまとめたいときに使えます。

## コード

```lua:line-numbers=361
function lume.concat(...)
  local rtn = {}
  for i = 1, select("#", ...) do
    local t = select(i, ...)
    if t ~= nil then
      local iter = getiter(t)
      for _, v in iter(t) do
        rtn[#rtn + 1] = v
      end
    end
  end
  return rtn
end
```

## 前提知識

- **可変長引数 `...`**: 関数に、いくつでも引数を渡せる書き方です。`select("#", ...)` で数を、`select(i, ...)` で `i` 番目を取り出せます。
- **`select`**: 可変長引数から、指定した位置の値を取り出す Lua の標準関数です。`"#"` を渡すと、引数の数が返ります。
- **`nil` の扱い**: 可変長引数の中の `nil` は、普通の値として数えられます。そのため、`nil` を見分けるための判定が必要になります。
- **`rtn[#rtn + 1]`**: 配列の末尾に 1 つ足す書き方です。複数の表をつなぐときは、この形が続きに足す役目をします。

## 何をしているか

### 1. 引数を順に取り出す

`select("#", ...)` で引数の数を決め、`i` を 1 から順に回します。`select(i, ...)` で、各引数の表を取り出します。

```lua:line-numbers=363
  for i = 1, select("#", ...) do
    local t = select(i, ...)
```

### 2. 引数が nil でなければ、その要素を末尾に足す

取り出した表が `nil` でなければ、表を回して、要素を `rtn` の末尾に 1 つずつ足します。`nil` の引数は、ここで何もせずに飛ばされます。

```lua:line-numbers=365
    if t ~= nil then
      local iter = getiter(t)
      for _, v in iter(t) do
        rtn[#rtn + 1] = v
      end
    end
```

### 3. つないだ配列を返す

すべての引数を回し終わったら、`rtn` を返します。元の表は、一つも変わりません。

```lua:line-numbers=372
  return rtn
```

## ここがすごい

- **欠けを許す**: 途中に `nil` の引数があっても、エラーにせず、残りを続けてつなぎます。呼ぶ側が、欠けを気にせず渡せます。
- **元の表を変えない**: 結果は新しい配列なので、もとの表を別の処理で使い続けられます。
- **種類を気にしない**: 各引数は `getiter` で回すので、配列でも連想配列でも、要素の値を順に集められます。
- **注意点**: 連想配列のキーは、つなぐときに失われます。キーも残したいときは、`lume.merge` を使ってください。

## まとめ

- 可変長引数を順に回すと、いくつの表でも一つにまとめられる。
- `nil` を飛ばす判定を入れると、途中の欠けに強い関数になる。
- 順番どおりにつなぐ処理と、キーを残す処理は、別の関数に分けると分かりやすい。
