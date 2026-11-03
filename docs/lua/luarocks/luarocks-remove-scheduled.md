---
title: 予約した後片付けを、取り消して外す
description: Lua のパッケージマネージャ LuaRocks の remove_scheduled_function。予約の返り値を目印にして、予約のリストから該当するものだけを取り除きます。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [73, 80]
format: 2
function: util.remove_scheduled_function
difficulty: 1
tags: [設計パターン, 防御的プログラミング, データ構造]
---

## ひとことで

`util.remove_scheduled_function(item)` は、前に予約した後片付けを取り消す関数です。予約するときに返された `item` という表を目印にして、予約の一覧からその表を探し、見つかれば取り除きます。予定を立てた後で、やっぱり不要になったときに使います。

## コード

```lua:line-numbers=73
function util.remove_scheduled_function(item)
   for k, v in ipairs(scheduled_functions) do
      if v == item then
         table.remove(scheduled_functions, k)
         return
      end
   end
end
```

## 前提知識

- **予約の戻り値**: `schedule_function` は、登録した表（関数と引数を入れたもの）を返します。この表が、予約の目印になります。
- **`ipairs`**: 配列を先頭から順に回す標準関数です。
- **`table.remove(t, k)`**: 配列の `k` 番目を取り除き、後ろを詰める標準関数です。
- **同じ実体の比較**: テーブルの `==` は、中身ではなく同じ実体かを比べます。目印として使えるのはこのためです。

## 何をしているか

### 1. 予約の一覧を先頭から探す

`ipairs(scheduled_functions)` で、予約を先頭から 1 つずつ見ます。

```lua:line-numbers=74
   for k, v in ipairs(scheduled_functions) do
```

### 2. 同じ実体を見つけたら取り除く

`v == item` のとき、同じ予約だと分かります。`table.remove` でその位置を取り除き、`return` で終わります。

```lua:line-numbers=76
         table.remove(scheduled_functions, k)
```

### 3. 見つからなければ何もしない

一致するものがなければ、何もせずに終わります。すでに実行されたか、取り消し済みの予約でも、エラーにはなりません。


補足として、目印を使う方法は、予約の順番を変えても正しく動きます。番号で探すと、予約を取り除いた後に番号がずれてしまいますが、目印で探せば、どの位置にあっても確実に同じものを見つけられます。

## ここがすごい

- **目印を返す設計**: 予約するときに目印を返しておくと、後で同じものを正確に指せます。名前や番号で探すより、確実です。
- **見つからなくても安全**: 二重の取り消しや、すでに実行済みの予約でも、エラーにならずに終わります。
- **注意点**: `table.remove` は後ろの要素を詰めます。ループの中で取り除くと、次の要素を飛ばす危険があります。この関数は `return` で必ず 1 回で止めるので、その問題を避けています。

## まとめ

- 予約には目印を返し、取り消すときは目印で探すと確実。
- 見つからなくても安全に終わるようにしておくと、使う側が気にせずに済む。
- 配列を取り除きながら回るときは、ずれに注意する。
