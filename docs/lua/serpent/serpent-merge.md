---
title: 二つの表を一つにまとめる、merge の一行
description: Lua のシリアライズライブラリ serpent の merge。表 b のキーと値を、表 a に上書きで写します。表 b が nil のときは、何もせずに a を返します。
language: lua
project: serpent
repo: https://github.com/pkulchenko/serpent
license: MIT
copyright: Copyright (c) 2012-2018 Paul Kulchenko
commit: "139fc18263bc5ffecc1729147891f1eb383046bf"
file: src/serpent.lua
lines: [147, 147]
format: 2
function: merge
difficulty: 1
tags: [データ構造, イディオム, 可読性]
---
## ひとことで

`merge(a, b)` は、表 `b` のキーと値を、表 `a` に写して、`a` を返す関数です。同じキーがあれば、`b` の値で上書きされます。`b` が `nil` のときは、何もせずに `a` をそのまま返します。設定の表に、利用者の指定を重ねるために使われます。

## コード

```lua:line-numbers=147
local function merge(a, b) if b then for k,v in pairs(b) do a[k] = v end end; return a; end
```

## 前提知識

- **`pairs` の差し替え**: serpent は、ファイル先頭で `pairs` を自分の定義に置き換えています。ここで使われる `pairs` は、その置き換えた版です。
- **上書きの代入**: `a[k] = v` は、キー `k` に既に値があれば、その値を置き換えます。
- **`nil` の判定**: `if b then` は、`b` が `nil` か `false` でないかを確かめます。省略された引数を、安全に無視できます。
- **戻り値**: 関数は `a` を返すので、呼ぶ側は結果を変数に受け取れます。元の `a` と同じ表なので、参照としても使えます。

## 何をしているか

### 1. b があれば、キーと値を写す

`b` が真なら、`pairs(b)` で各キーと値を取り出し、`a[k] = v` で `a` に写します。`b` が `nil` なら、この `for` は実行されません。

```lua:line-numbers=147
local function merge(a, b) if b then for k,v in pairs(b) do a[k] = v end end; return a; end
```

### 2. a を返す

最後に `a` を返します。写し終わった表を、そのまま呼び出し元が使えます。

## ここがすごい

- **一行で済む短さ**: 条件分岐、繰り返し、返す処理が、ひとつの行に収まっています。短い関数の好例です。
- **省略に強い**: 第 2 引数が無くても、エラーにならずに `a` を返します。呼び出しの形が一つで済みます。
- **既存の表に重ねる**: 新しい表を作らず、`a` を書き換えます。大きな表でも、余計な複製を作りません。
- **注意点**: 元の `a` が変わるので、重ねる前の値が必要なら、先に写しを作っておいてください。また、入れ子の表は、中身が浅く写されます。

## まとめ

- 設定の重ね合わせは、後から渡す表で上書きする、と決めておくと扱いやすい。
- 省略できる引数を `nil` の判定で無視すると、呼び出しが簡単になる。
- 既存の表を書き換える関数では、元の値が必要かどうかを考えておく。
