---
title: JSON 全体を読み、余りの文字をエラーにする decode
description: Lua の JSON ライブラリ rxi/json.lua の decode。文字列が文字列型かを確かめ、先頭の空白を飛ばして値を読みます。その後に余計な文字が残っていればエラーにします。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [375, 385]
format: 2
function: json.decode
difficulty: 2
tags: [パース, 防御的プログラミング, エラー処理]
---
## ひとことで

`json.decode(str)` は、JSON の文字列を Lua の値に読み込む公開の関数です。読み込みの前に、引数の型を確かめます。値を読んだ後も、末尾に空白以外の文字が残っていれば、エラーにします。「値が一つだけ」という JSON の決まりを、確実に守るための関数です。

## コード

```lua:line-numbers=375
function json.decode(str)
  if type(str) ~= "string" then
    error("expected argument of type string, got " .. type(str))
  end
  local res, idx = parse(str, next_char(str, 1, space_chars, true))
  idx = next_char(str, idx, space_chars, true)
  if idx <= #str then
    decode_error(str, idx, "trailing garbage")
  end
  return res
end
```

## 前提知識

- **`parse`**: 値を一つ読み、その値と次の位置を返す内部の関数です。配列やオブジェクトなど、どの種類の値も、この関数から読み始めます。
- **`next_char`**: 指定した文字集合のどれかが現れる位置を探す関数です。ここでは、先頭と末尾の空白を飛ばすために使われます。
- **`space_chars`**: 空白の文字だけを集めた集合です。JSON では、値の前後に空白を置けます。
- **`decode_error`**: 不正な JSON の位置と理由を、利用者に伝えるエラーを起こす関数です。

## 何をしているか

### 1. 引数が文字列か確かめる

`type(str) ~= "string"` のときは、`error` でエラーにします。文字列でない値を読もうとすると、奇妙なエラーになるのを、ここで防ぎます。

```lua:line-numbers=376
  if type(str) ~= "string" then
    error("expected argument of type string, got " .. type(str))
  end
```

### 2. 先頭の空白を飛ばして、値を読む

`next_char` で先頭の空白を飛ばし、そこから `parse` で値を一つ読みます。読んだ値と、読み終えた位置 `idx` を受け取ります。

```lua:line-numbers=379
  local res, idx = parse(str, next_char(str, 1, space_chars, true))
```

### 3. 末尾に余りがあればエラーにする

読んだ後の末尾の空白も飛ばします。それでもまだ文字が残っていれば、`decode_error` で「余計な文字がある」と報告します。読んだ値だけを返すのは、残りがないときだけです。

```lua:line-numbers=380
  idx = next_char(str, idx, space_chars, true)
  if idx <= #str then
    decode_error(str, idx, "trailing garbage")
  end
  return res
```

## ここがすごい

- **入口で型を確かめる**: 文字列でない引数を、早い段階で弾きます。エラーの原因が、すぐに分かります。
- **値の後ろまで確かめる**: `[1] 2` のように、値の後ろに余りがあると、正しい JSON ではありません。この関数は、その余りを見逃さずに報告します。
- **空白の扱いを統一**: 先頭と末尾で、同じ `next_char` と空白の集合を使っています。読み方の規則が、一か所で決まります。
- **注意点**: 読み込んだ値は、JSON の型に応じて Lua の値になります。`null` は `nil` になるので、表の中の項目が消えたように見えることがあります。

## まとめ

- 公開の入口では、引数の型を最初に確かめると、後の処理の誤りを防げる。
- 値を読んだ後も、残りの文字を確かめると、不正な入力を見逃さない。
- 空白の扱いを同じ関数で揃えると、読み方の規則が分かりやすくなる。
