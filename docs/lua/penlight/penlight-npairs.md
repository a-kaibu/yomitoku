---
title: 配列を歩くとき、飛ばす幅と終わりを決められるイテレータ
description: Lua のユーティリティ集 Penlight の npairs。開始位置、終了位置、ステップ幅を指定して配列を順に回せるイテレータを作ります。逆順も同じ関数で扱います。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [204, 229]
format: 2
function: utils.npairs
difficulty: 2
tags: [イテレータ, データ構造, クロージャ]
---

## ひとことで

`utils.npairs(t, i_start, i_end, step)` は、配列 `t` の要素を `i_start` から `i_end` まで `step` ずつ飛ばして順に返すイテレータを作る関数です。Lua 標準の `ipairs` は、最初から最後まで 1 ずつしか回れません。`npairs` は、飛ばし幅や逆向きの移動も指定できます。

## コード

```lua:line-numbers=204
function utils.npairs(t, i_start, i_end, step)
  step = step or 1
  if step == 0 then
    error("iterator step-size cannot be 0", 2)
  end
  local i = (i_start or 1) - step
  i_end = i_end or t.n or #t
  if step < 0 then
    return function()
      i = i + step
      if i < i_end then
        return nil
      end
      return i, t[i]
    end

  else
    return function()
      i = i + step
      if i > i_end then
        return nil
      end
      return i, t[i]
    end
  end
end
```

## 前提知識

- **イテレータ**: `for` 文で値を 1 つずつ取り出すための関数です。`for i, v in f do` の `f` がイテレータで、呼ぶたびに次の組を返し、`nil` で終わります。
- **クロージャ**: 関数の中の関数が、外側の変数（ここでは `i` や `i_end`）を覚えたまま使い続けられる仕組みです。
- **`t.n`**: 配列に要素数を `n` として持たせる慣習です。`nil` や穴があっても正しい長さを表せるので、あれば優先して使われます。
- **`#t`**: テーブルの長さを返す演算子です。穴のない配列では、要素の数と同じになります。

## 何をしているか

### 1. 既定値を決めて、ゼロの幅を弾く

`step` が省略されたら `1` にします。`step` が `0` だと、イテレータが永遠に同じ位置を返すので、`error` で止めます。第 2 引数の `2` は、エラーの位置を呼び出し側にするための指定です。

```lua:line-numbers=205
  step = step or 1
  if step == 0 then
    error("iterator step-size cannot be 0", 2)
  end
```

### 2. 開始位置と終了位置を決める

`i` は、最初の呼び出しで `step` を足すと開始位置になるように、あらかじめ `step` を引いておきます。終了位置は、指定がなければ `t.n` か `#t` を使います。

```lua:line-numbers=209
  local i = (i_start or 1) - step
  i_end = i_end or t.n or #t
```

### 3. 向きに応じてイテレータを返す

`step` が負なら、`i` が `i_end` より小さくなったら終わります。正なら、`i` が `i_end` より大きくなったら終わります。どちらも、`i` を `step` だけ進めてから値を返します。

```lua:line-numbers=211
  if step < 0 then
    return function()
      i = i + step
      if i < i_end then
        return nil
      end
      return i, t[i]
    end
```

## ここがすごい

- **1 つの関数で正順と逆順を扱う**: 逆向きのときは比べる向きを変えるだけです。`for i, v in utils.npairs(t, #t, 1, -1)` と書けば、末尾から先頭へ回れます。
- **初期値を `i_start - step` にする**: `ipairs` のような最初の特別扱いを書かずに、どのステップ幅でも同じ形のイテレータになります。
- **`t[i]` を返すだけ**: 値を配列に写し取らず、必要な位置だけ参照します。大きな配列でも余分なコピーがありません。
- **注意点**: 穴のある配列を `#t` で長さを決めると、途中で終わることがあります。`t.n` を設定しておくと、この問題を避けられます。

## まとめ

- 「飛ばし幅」と「終わり」を引数にすると、配列を回る処理を 1 つのイテレータで書ける。
- 初期値を 1 つ手前にしておくと、最初の呼び出しの特別扱いが要らない。
- 値をコピーせず、必要な位置だけ参照すると、大きな配列でも効率がよい。
