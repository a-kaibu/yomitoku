---
title: 値を一つ取り除く remove、配列と連想配列で方法を変える
description: Lua のユーティリティ集 lume の remove。最初に見つかった値を表から取り除きます。配列なら table.remove で詰め、連想配列なら対応するキーを nil にします。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [174, 188]
format: 2
function: lume.remove
difficulty: 2
tags: [データ構造, イテレータ, イディオム]
---
## ひとことで

`lume.remove(t, x)` は、表 `t` の中から値 `x` を一つだけ探して、取り除く関数です。配列の場合は、後ろの要素を前に詰めます。連想配列の場合は、そのキーの値を `nil` にして消します。どちらの形でも、同じ `remove` で扱えるようにした関数です。

## コード

```lua:line-numbers=174
function lume.remove(t, x)
  local iter = getiter(t)
  for i, v in iter(t) do
    if v == x then
      if lume.isarray(t) then
        table.remove(t, i)
        break
      else
        t[i] = nil
        break
      end
    end
  end
  return x
end
```

## 前提知識

- **`table.remove`**: 配列から一つの要素を取り除く標準関数です。取り除いた後の要素は、番号を詰めて前にずれます。
- **`t[i] = nil`**: 表のキーに `nil` を代入すると、そのキーは表から消えます。連想配列の要素を消すときの基本です。
- **`lume.isarray`**: 表が配列かどうかを判定する lume の関数です。配列なら `1` のキーに値があるかで決めます。
- **`break`**: 繰り返しを途中で抜けるための文です。ここでは、最初の一致だけを取り除くために使われています。

## 何をしているか

### 1. 一致する値を探す

`getiter(t)` で表を回し、`v == x` となる要素を探します。最初に見つかった要素の位置を `i` として使います。

```lua:line-numbers=175
  local iter = getiter(t)
  for i, v in iter(t) do
    if v == x then
```

### 2. 配列なら番号を詰めて取り除く

表が配列なら、`table.remove(t, i)` を呼びます。取り除いた後の要素は、前に詰められるので、配列は切れ目なく保たれます。

```lua:line-numbers=178
      if lume.isarray(t) then
        table.remove(t, i)
        break
      else
```

### 3. 連想配列ならキーを消す

配列でなければ、`t[i] = nil` で、そのキーの値を消します。ほかのキーの位置は、そのまま残ります。どちらの場合も、`break` で一つだけ取り除いて終わります。

```lua:line-numbers=182
        t[i] = nil
        break
      end
```

### 4. 取り除いた値を返す

最後に `x` を返します。呼ぶ側は、どの値を取り除こうとしたかを、そのまま使えます。

```lua:line-numbers=187
  return x
```

## ここがすごい

- **配列と連想配列を見分ける**: 表の形によって取り除き方を変えるので、呼ぶ側は表の種類を意識せずに済みます。
- **一つだけ取り除く**: 同じ値が何個あっても、最初の一つだけを消します。一度に消しすぎない安全な作りです。
- **配列の詰め直し**: `table.remove` を使うので、配列の番号が途切れません。`t[i] = nil` だけだと、配列に穴が開いてしまいます。
- **注意点**: 配列の中を回しながら取り除くと、要素がずれて、思わぬ要素を飛ばすことがあります。ここでは、取り除いた直後に `break` するので、その問題を避けています。

## まとめ

- 配列の要素を取るときは、`table.remove` で詰めると、番号の穴を防げる。
- 連想配列の要素を消すときは、キーを `nil` にすると、他のキーに影響しない。
- 種類によって消し方を分けると、呼ぶ側は同じ書き方で済む。
