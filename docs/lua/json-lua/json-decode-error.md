---
title: エラーの位置を「行と列」に直して伝える JSON の解析エラー
description: JSON ライブラリ json.lua の decode_error。壊れた JSON の位置を「何文字目か」から「行と列の組み」に変換し、読む人が直せるメッセージにします。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [175, 186]
format: 2
function: decode_error
difficulty: 1
tags: [エラー処理, パース, 文字列処理]
---

## ひとことで

`decode_error(str, idx, msg)` は、JSON の解析に失敗したときに、そのエラーを「どの行の何列目か」を添えて `error` で投げる関数です。`idx` は文字列の先頭から数えた位置なので、そのままでは人間が探しにくい値です。この関数はそれを行と列に直してから、わかりやすいメッセージにします。

## コード

```lua:line-numbers=175
local function decode_error(str, idx, msg)
  local line_count = 1
  local col_count = 1
  for i = 1, idx - 1 do
    col_count = col_count + 1
    if str:sub(i, i) == "\n" then
      line_count = line_count + 1
      col_count = 1
    end
  end
  error( string.format("%s at line %d col %d", msg, line_count, col_count) )
end
```

## 前提知識

- **`error`**: エラーを発生させて、処理を途中で止める関数です。`pcall` で囲まない限り、プログラムはそこで止まります。
- **`string.format`**: `%s`（文字列）、`%d`（整数）などの場所に値を入れて、文字列を組み立てる関数です。C の `printf` に似ています。
- **文字の位置**: Lua の文字列は 1 から数え、`str:sub(i, i)` で `i` 番目の 1 文字を取り出せます。
- **改行 `\n`**: 行の終わりを表す文字です。ここでは「行が変わった」ことを見つけるために使います。

## 何をしているか

### 1. 行と列を 1 から数え始める

行も列も、人間が数えるときと同じく 1 から始めます。最初の文字は、行も列も「1」から始まる位置です。

```lua:line-numbers=176
  local line_count = 1
  local col_count = 1
```

### 2. エラー位置まで 1 文字ずつ進める

`for i = 1, idx - 1` で、先頭からエラーのある直前までを 1 文字ずつ見ていきます。`idx` 自身は含めないので、エラーの場所そのものは数えません。

```lua:line-numbers=178
  for i = 1, idx - 1 do
    col_count = col_count + 1
```

### 3. 改行を見つけたら行を進めて列を戻す

見た文字が改行 `\n` だったら、行の番号を 1 つ増やし、列を `1` に戻します。改行の後の文字から、新しい行の 1 列目として数え直すためです。

```lua:line-numbers=180
    if str:sub(i, i) == "\n" then
      line_count = line_count + 1
      col_count = 1
    end
```

### 4. 位置付きのメッセージにして投げる

最後に、元のメッセージと行・列を `string.format` で 1 つの文字列にまとめ、`error` で投げます。

```lua:line-numbers=185
  error( string.format("%s at line %d col %d", msg, line_count, col_count) )
```

たとえば `{"a":` の次の行に `  tru}` と書かれていると、解析は `tru` の先頭の `t` でエラーになります。このとき、エラーは `t` の位置を指すので、ユーザーはその場所を見るだけで壊れた箇所に気づけます。

## ここがすごい

- **「位置」を人間が使える形にする**: 解析器の内部では、位置は単なる数字です。それを行と列に直すことで、エラーメッセージが編集エディタでの探し方とそのまま一致します。
- **1 関数で完結する**: 行と列の計算を、解析の処理に混ぜずに別の関数にしたので、解析の本体がすっきり読めます。
- **素直な書き方との比較**: 行の情報を解析中ずっと持ち歩く方法もあります。ただしそれだと、すべての処理で行番号を更新する必要があります。エラーのときだけ数え直す方が、コードが少なく、正しさも保ちやすくなります。
- **トレードオフ**: エラーのたびに先頭から数え直すので、巨大な JSON で何度もエラーが起きると時間がかかります。ただし、エラーは通常 1 回で処理が止まるので、実用上は問題になりません。

## まとめ

- 内部の位置は、利用者が使える単位（行と列）に変換してから伝える。
- 位置の計算はエラーが起きた時だけ行うと、通常の処理が速く保てる。
- `string.format` で位置付きのメッセージを組み立てると、原因を探しやすくなる。
