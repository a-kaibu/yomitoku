---
title: 数字の終わりを探して Lua の数値に変える、JSON の parse_number
description: JSON ライブラリ json.lua の parse_number。数字として読める範囲を区切り文字まで切り出し、tonumber で Lua の数値にします。失敗したときは場所を添えてエラーにします。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [259, 267]
format: 2
function: parse_number
difficulty: 1
tags: [パース, 数値計算, エラー処理]
---

## ひとことで

`parse_number(str, i)` は、JSON の中で数字が始まる位置 `i` から、区切り文字までの文字を切り出して、Lua の数値に変換する関数です。`-12.5e3` のような書き方も、`tonumber` という Lua の標準関数が解釈してくれます。数字として読めない場合は、エラーを出します。

## コード

```lua:line-numbers=259
local function parse_number(str, i)
  local x = next_char(str, i, delim_chars)
  local s = str:sub(i, x - 1)
  local n = tonumber(s)
  if not n then
    decode_error(str, i, "invalid number '" .. s .. "'")
  end
  return n, x
end
```

## 前提知識

- **`tonumber`**: 文字列を数値に変換する標準関数です。変換できなければ `nil` を返します。`tonumber("42")` は `42`、`tonumber("abc")` は `nil` です。
- **区切り文字**: JSON では、数字の後に `,`、`]`、`}` や空白が続きます。ここでは `delim_chars` という集合を使って、その位置を探します。
- **複数の戻り値**: Lua の関数は、`return n, x` のように複数の値を同時に返せます。呼び出し側は `local a, b = f()` のように受け取ります。
- **`decode_error`**: 解析エラーを、行と列の位置付きで投げる関数です。

## 何をしているか

### 1. 数字の終わりを探す

`next_char(str, i, delim_chars)` で、`i` から見て最初に出てくる区切り文字の位置を探します。数字は、その直前までが 1 つのまとまりです。

```lua:line-numbers=260
  local x = next_char(str, i, delim_chars)
```

区切り文字の集合は `create_set` で作られています。

```lua:line-numbers=154
local delim_chars   = create_set(" ", "\t", "\r", "\n", "]", "}", ",")
```

### 2. 数字の候補の文字列を切り出す

`str:sub(i, x - 1)` で、数字の始まりから区切り文字の 1 つ前までを取り出します。`x` は区切りの位置なので、`x - 1` が数字の最後の文字になります。

```lua:line-numbers=261
  local s = str:sub(i, x - 1)
```

### 3. 数値に変換して、失敗したら報告する

`tonumber(s)` で数値に変えます。変換できなければ `n` は `nil` なので、`decode_error` でエラーにします。エラーメッセージには、問題の文字列そのものを入れて、どの値が悪かったかがわかるようにしています。

```lua:line-numbers=262
  local n = tonumber(s)
  if not n then
    decode_error(str, i, "invalid number '" .. s .. "'")
  end
```

### 4. 値と次の位置を返す

成功したら、数値 `n` と、次に読み始める位置 `x` を返します。呼び出し側は、この `x` から解析を続けます。

```lua:line-numbers=266
  return n, x
```

## ここがすごい

- **数字の文法を自分で書かない**: `-12.5e3` や `1E+2` のような数字の形を、1 つずつ判定するのは大変です。区切りまでを切り出して `tonumber` に任せると、Lua が理解する数字の形をそのまま使えます。
- **区切りの決め方が単純**: 数字は「区切りまで」と決めれば、どこまでが数字かを数えるロジックが不要です。`delim_chars` を変えるだけで、対応する範囲を広げ・狭めできます。
- **素直な書き方との比較**: 1 文字ずつ数字として正しいかを確かめる方法は、コードが長くなります。切り出してから変換する方法は、短く、失敗の検出も 1 か所で済みます。
- **注意点**: `tonumber` は `"0x1F"` のような 16 進数も受け付けます。JSON の文法では許されない形ですが、この関数は厳密なチェックをしていません。

## まとめ

- 数字の範囲は、区切り文字までを切り出すと簡単に決められる。
- 変換は標準関数の `tonumber` に任せ、`nil` が返ったら失敗として報告する。
- 関数は値と次の位置を一緒に返すと、解析の続きを呼び出し側が簡単に扱える。
