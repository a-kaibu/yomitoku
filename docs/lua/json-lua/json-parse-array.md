---
title: 空の配列と次の値を、読む前に確かめる JSON の配列解析
description: JSON ライブラリ json.lua の parse_array。[ の後の空白を飛ばし、] が来たら空の配列として終わり、そうでなければ値を読んでから , か ] を待ちます。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [280, 304]
format: 2
function: parse_array
difficulty: 2
tags: [パース, 状態機械, エラー処理]
---

## ひとことで

`parse_array(str, i)` は、JSON の `[` から `]` までの配列を読み、Lua の配列にして返す関数です。要素の間は `,` で区切られ、空白は読み飛ばされます。書式が違うと、`decode_error` で位置を示して止まります。

## コード

::: code-group

```lua:line-numbers=280 [日本語訳]
local function parse_array(str, i)
  local res = {}
  local n = 1
  i = i + 1
  while 1 do
    local x
    i = next_char(str, i, space_chars, true)
    -- 空の配列か、配列の終わりか？
    if str:sub(i, i) == "]" then
      i = i + 1
      break
    end
    -- 値を 1 つ読む
    x, i = parse(str, i)
    res[n] = x
    n = n + 1
    -- 次の記号
    i = next_char(str, i, space_chars, true)
    local chr = str:sub(i, i)
    i = i + 1
    if chr == "]" then break end
    if chr ~= "," then decode_error(str, i, "expected ']' or ','") end
  end
  return res, i
end
```

```lua:line-numbers=280 [原文]
local function parse_array(str, i)
  local res = {}
  local n = 1
  i = i + 1
  while 1 do
    local x
    i = next_char(str, i, space_chars, true)
    -- Empty / end of array?
    if str:sub(i, i) == "]" then
      i = i + 1
      break
    end
    -- Read token
    x, i = parse(str, i)
    res[n] = x
    n = n + 1
    -- Next token
    i = next_char(str, i, space_chars, true)
    local chr = str:sub(i, i)
    i = i + 1
    if chr == "]" then break end
    if chr ~= "," then decode_error(str, i, "expected ']' or ','") end
  end
  return res, i
end
```

:::

## 前提知識

- **JSON の配列**: `[1, 2, 3]` のように、値をカンマで区切り、角かっこで囲んだ形です。
- **`parse`**: 値を 1 つ読んで、その値と次の位置を返す関数です。このファイルの中で、配列や文字列を読むときに呼ばれます。
- **`next_char`**: 空白のように飛ばす文字を読み飛ばして、次の意味のある文字の位置を返す関数です。
- **`while 1 do`**: 無限に繰り返す書き方です。中の `break` で抜けます。

## 何をしているか

### 1. 空白を飛ばして、空の配列か確かめる

`next_char(str, i, space_chars, true)` で、空白を飛ばします。その位置が `]` なら、空の配列として終わります。

```lua:line-numbers=288
    if str:sub(i, i) == "]" then
```

### 2. 値を 1 つ読んで、配列に入れる

`parse(str, i)` で値を 1 つ読み、`res[n]` に入れます。`n` は次の番号を数えるための変数です。

```lua:line-numbers=293
    x, i = parse(str, i)
```

### 3. 次が `]` か `,` かを確かめる

値の後の空白を飛ばし、1 文字を読みます。`]` なら終わり、`,` なら次の値へ進みます。それ以外は、エラーになります。

```lua:line-numbers=298
    local chr = str:sub(i, i)
```

```lua:line-numbers=301
    if chr ~= "," then decode_error(str, i, "expected ']' or ','") end
```

## ここがすごい

- **空の配列と通常の配列を 1 つの流れで扱う**: 最初に `]` を確かめるだけで、空の配列を特別な分岐なしで扱えます。
- **値の後の確認で、書式の誤りを早く見つける**: `,` でも `]` でもない文字が来た時点で、位置付きのエラーを出します。
- **空白の扱いを一貫させる**: 値の前と後で、同じ `next_char` を使っています。書式の中の空白は、どこに入っても読めます。
- **注意点**: `[1,]` のような末尾のカンマは、この関数では値の読み取りで失敗します。書式の厳しさは、JSON の仕様に沿っています。

## まとめ

- 配列の解析は、先に空かどうかを確かめ、値を読み、次の区切りを確かめる、という順で書くと分かりやすい。
- 区切りの確認をその場で行うと、書式の誤りを位置付きで報告できる。
