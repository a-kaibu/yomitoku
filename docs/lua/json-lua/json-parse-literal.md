---
title: true・false・null を、語として読み取る parse_literal
description: Lua の JSON ライブラリ rxi/json.lua の parse_literal。区切りまでの語を取り出し、true・false・null のどれかなら対応する Lua の値を返します。それ以外はエラーにします。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [270, 277]
format: 2
function: parse_literal
difficulty: 2
tags: [パース, 防御的プログラミング, エラー処理]
---
## ひとことで

`parse_literal(str, i)` は、JSON の文字列の位置 `i` から、`true`、`false`、`null` のどれかを読み取る関数です。読み取った語が、この 3 つの中になければ、エラーを起こします。JSON の値の中で、数や文字列以外の単語を扱うための、最後の入口です。

## コード

```lua:line-numbers=270
local function parse_literal(str, i)
  local x = next_char(str, i, delim_chars)
  local word = str:sub(i, x - 1)
  if not literals[word] then
    decode_error(str, i, "invalid literal '" .. word .. "'")
  end
  return literal_map[word], x
end
```

## 前提知識

- **`next_char`**: 文字列の中で、指定した文字集合のどれかが現れるまでの位置を返す関数です。ここでは、区切りの文字を探すために使われます。
- **`str:sub(i, x - 1)`**: 位置 `i` から `x - 1` までの部分文字列を取り出します。語の範囲を切り出すための書き方です。
- **`literals` と `literal_map`**: 語の一覧と、その語に対応する Lua の値の表です。`literals[word]` で、語が正しいかを調べ、`literal_map[word]` で値を取り出します。
- **複数の戻り値**: `return literal_map[word], x` は、値と次の読み取り位置の 2 つを返します。JSON の読み取りでは、この形がよく使われます。

## 何をしているか

### 1. 区切りまでの語を切り出す

`next_char(str, i, delim_chars)` で、語の終わりの位置 `x` を探します。`str:sub(i, x - 1)` で、今の位置から語の終わりまでを切り出します。

```lua:line-numbers=271
  local x = next_char(str, i, delim_chars)
  local word = str:sub(i, x - 1)
```

### 2. 知らない語ならエラーにする

切り出した語が `literals` の中になければ、`decode_error` を呼びます。どの位置で、何の語が不正だったかを、利用者に伝えるためです。

```lua:line-numbers=273
  if not literals[word] then
    decode_error(str, i, "invalid literal '" .. word .. "'")
  end
```

### 3. 語に対応する値と、次の位置を返す

正しい語なら、`literal_map[word]` で Lua の値（`true`、`false`、`nil`）を取り出します。そして、その値と、次に読む位置 `x` を返します。

```lua:line-numbers=276
  return literal_map[word], x
```

## ここがすごい

- **表で語を分ける**: `if` を三つ並べる代わりに、表で語と値を結びつけています。新しい語を足すときも、表に一行足すだけで済みます。
- **エラーの場所が分かる**: 不正な語が見つかったときは、位置と語を一緒に報告します。大きな JSON の中でも、どこが壊れているかを見つけやすくなっています。
- **区切りまで読む**: 語の終わりを区切り文字で決めるので、`trueabc` のような語も、まとまりとして正しく判定されます。
- **注意点**: `null` は Lua の `nil` になるので、表の中で値を入れると、その項目は消えたように見えます。この点は、利用する側で意識する必要があります。

## まとめ

- 決まった語の集まりを読むときは、語と値の対応を表にすると、判定が簡単になる。
- 不正な語は、位置と内容を付けてエラーにすると、原因を見つけやすい。
- 読み取りの結果は、値と次の位置を一緒に返すと、続きの読み取りがしやすい。
