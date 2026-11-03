---
title: 表示するキーを「そのまま書けるか」を判定する
description: Lua のデバッグ表示ライブラリ inspect.lua の isIdentifier。キーが有効な変数名の形か、予約語でないかを調べ、{name = 1} と書くか {["for"] = 1} と書くかを決めます。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [131, 135]
format: 2
function: isIdentifier
difficulty: 1
tags: [文字列処理, 正規表現, 可読性]
---

## ひとことで

`isIdentifier(str)` は、文字列が Lua の名前（識別子）として書けるかを判定する関数です。`name` は書けますが、`for` は予約語なので書けません。`inspect` は、書けるキーは `name = 1` の形で、書けないキーは `["for"] = 1` の形で表示するために、この判定を使います。

## コード

```lua:line-numbers=131
local function isIdentifier(str)
   return type(str) == "string" and
   not not str:match("^[_%a][_%a%d]*$") and
   not luaKeywords[str]
end
```

判定に使う予約語の表は、関数の外で作られています。読むのに必要なので引用します。

```lua:line-numbers=124
local luaKeywords = {}
for k in ([[ and break do else elseif end false for function goto if
             in local nil not or repeat return then true until while
]]):gmatch('%w+') do
   luaKeywords[k] = true
end
```

## 前提知識

- **識別子（identifier）**: 変数名や関数名のことです。英字かアンダースコアで始まり、英数字とアンダースコアが続きます。数字からは始まりません。
- **予約語（keyword）**: `if`、`for`、`end` など、言語が文法として使う単語です。変数名には使えません。
- **パターン `^...$`**: `^` は文字列の先頭、`$` は末尾を表します。両方を付けると、文字列全体がパターンに一致するかを調べられます。
- **`not not`**: 値を真偽値に変える書き方です。`match` は見つからないと `nil` を返すので、`not not` で `true` か `false` にそろえます。

## 何をしているか

### 1. 文字列であることを確かめる

`type(str) == "string"` で、キーが文字列かを確かめます。数字のキーなどは、そもそも名前の形ではないので、この時点で `false` になります。

```lua:line-numbers=132
   return type(str) == "string" and
```

### 2. 名前の形をパターンで調べる

`^[_%a][_%a%d]*$` は、「先頭がアンダースコアか英字、その後は英数字かアンダースコアが続く」という形です。`match` が見つけられれば、`not not` で `true` になります。

```lua:line-numbers=133
   not not str:match("^[_%a][_%a%d]*$") and
```

### 3. 予約語でないことを確かめる

`luaKeywords[str]` は、その文字列が予約語の表にあれば `true` です。`not` で反転させて、予約語でないことを確かめます。

```lua:line-numbers=134
   not luaKeywords[str]
```

### 4. 予約語の表はどう作られるか

予約語は 1 つの文字列にまとめられ、`gmatch('%w+')` で単語ごとに取り出されます。各単語を `luaKeywords[k] = true` で登録するので、判定の参照は 1 回で済みます。

## ここがすごい

- **書き方を変えるだけで正しさが保てる**: `for = 1` と書くと、Lua のコードとして読めません。判定を入れたことで、表示された値をそのままコードに貼っても動く形を保てます。
- **予約語を 1 つの長い文字列にまとめる**: 表を作る部分が、単語を並べた長い文字列だけで済んでいます。予約語が増えても、そこに単語を足すだけです。
- **パターン 1 行で形を判定**: 名前の決まりを正規表現に似たパターン 1 つで書いています。ここまでが短いので、読む人が一目で決まりを理解できます。
- **注意点**: このパターンは ASCII の英字だけを名前として認めます。Lua 5.x の標準では、この決まりで足りますが、ロケールによって `%a` の意味が変わる点には注意が要ります。

## まとめ

- 表示に使うキーは、名前の形と予約語でないことを両方確かめると、コードとして正しい形になる。
- `not not` を使うと、`match` の結果を真偽値にそろえられる。
- 予約語のような固定の一覧は、1 つの文字列にまとめてから表に変換すると書きやすい。
