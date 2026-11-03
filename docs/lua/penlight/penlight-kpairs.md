---
title: 整数でない鍵だけを回す、kpairs のイテレータ
description: Lua のユーティリティ集 Penlight の utils.kpairs。表の鍵のうち、整数の添字以外のものだけを順に返すイテレータを作ります。配列の部分を飛ばして、名前付きの項目だけを見たいときに使えます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [258, 270]
format: 2
function: utils.kpairs
difficulty: 2
tags: [イテレータ, データ構造, クロージャ]
---
## ひとことで

`utils.kpairs(t)` は、表 `t` の鍵のうち、整数の添字以外のものだけを順に返すイテレータを作る関数です。配列の部分を読み飛ばし、名前で付けた項目だけを見たいときに使えます。`pairs` と同じように `for` で回して、鍵と値を受け取ります。

## コード

```lua:line-numbers=258
function utils.kpairs(t)
  local index
  return function()
    local value
    while true do
      index, value = next(t, index)
      if type(index) ~= "number" or floor(index) ~= index then
        break
      end
    end
    return index, value
  end
end
```

## 前提知識

- **`next(t, k)`**: 表のキー `k` の次にあるキーと値を返す標準関数です。`k` に `nil` を渡すと、最初のキーを返します。`pairs` も、内部でこの仕組みを使っています。
- **イテレータとしての閉包**: 返された関数は、外側の `index` を覚えています。呼ばれるたびに、その続きから探します。
- **`floor(index) ~= index`**: 数が整数かどうかを確かめる書き方です。小数の鍵は、整数と違うので、この比べ方で判定できます。
- **鍵の種類**: Lua の表の鍵には、数、文字列、表などがあります。配列は、整数の鍵 `1, 2, 3...` で並んでいます。

## 何をしているか

### 1. 閉包の中で、前回の鍵を覚える

`index` は、返された関数の外側に置かれます。関数が呼ばれるたびに、この変数が次の鍵の出発点になります。

```lua:line-numbers=259
  local index
  return function()
    local value
```

### 2. 整数でない鍵が出るまで、次へ進む

`next(t, index)` で次の鍵と値を取ります。鍵が数でない、または整数でないときは `break` で止まります。整数の鍵は、この `while` の中で読み飛ばされます。

```lua:line-numbers=262
    while true do
      index, value = next(t, index)
      if type(index) ~= "number" or floor(index) ~= index then
        break
      end
    end
```

### 3. 見つけた鍵と値を返す

止まった時点の鍵と値を返します。表の末尾に達したときは、鍵が `nil` になるので、`for` の繰り返しもそこで終わります。

```lua:line-numbers=268
    return index, value
  end
```

## ここがすごい

- **配列の部分を飛ばす**: 配列の要素が多くても、読み飛ばすだけで済みます。名前付きの項目を探す処理が、短く書けます。
- **状態を閉包に持たせる**: 位置の状態を、関数の外の変数に保つので、`for` の形で自然に回せます。
- **`pairs` の仕組みを再利用**: `next` を直接使うので、表を回す規則は `pairs` と同じです。
- **注意点**: 鍵の順番は、Lua の仕様では決まっていません。また、この関数は整数の鍵を全部飛ばすので、疎な整数の鍵も、残らず飛ばされます。

## まとめ

- 特定の種類の鍵だけを回すときは、`next` を使って読み飛ばすと、表の規則を崩さずに済む。
- 状態を閉包で持つと、`for` の形で使えるイテレータを簡単に作れる。
- 鍵の順番を仮定せず、必要なら並べ直す。
