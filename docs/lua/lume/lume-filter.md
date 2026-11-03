---
title: 条件に合う要素だけを残す filter
description: Lua のユーティリティ集 lume の filter。条件関数が真を返した要素だけを集めた新しい表を返します。キーを残すかどうかも選べます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [314, 328]
format: 2
function: lume.filter
difficulty: 1
tags: [関数型, イテレータ, イディオム]
---
## ひとことで

`lume.filter(t, fn, retainkeys)` は、表 `t` の要素のうち、条件 `fn` が真を返すものだけを集めた、新しい表を返す関数です。元の表は変えません。`retainkeys` に真を渡すと、元のキーも残せます。

## コード

```lua:line-numbers=314
function lume.filter(t, fn, retainkeys)
  fn = iteratee(fn)
  local iter = getiter(t)
  local rtn = {}
  if retainkeys then
    for k, v in iter(t) do
      if fn(v) then rtn[k] = v end
    end
  else
    for _, v in iter(t) do
      if fn(v) then rtn[#rtn + 1] = v end
    end
  end
  return rtn
end
```

## 前提知識

- **フィルタ（filter）**: 要素を一つずつ条件に通し、通ったものだけを残す操作です。関数型プログラミングでよく使われます。
- **`iteratee`**: 条件として、関数や値の指定を、統一された関数の形に整える lume の関数です。
- **キーと値の違い**: 配列では、順番のキーは振り直すのが普通です。連想配列では、元のキーを残すかどうかが意味を持ちます。
- **`rtn[#rtn + 1]`**: 配列の末尾に、1 つ足す書き方です。

## 何をしているか

### 1. 条件を整えて、結果の表を用意する

`fn` を `iteratee` で関数の形にします。結果を入れる空の表 `rtn` も作ります。

```lua:line-numbers=315
  fn = iteratee(fn)
  local iter = getiter(t)
  local rtn = {}
```

### 2. キーを残すなら、キーごとに入れる

`retainkeys` が真のときは、`for k, v` でキーと値を受け取り、条件が真なら `rtn[k] = v` とします。元のキーがそのまま残ります。

```lua:line-numbers=318
  if retainkeys then
    for k, v in iter(t) do
      if fn(v) then rtn[k] = v end
    end
```

### 3. 残さないなら、末尾に詰める

`retainkeys` が偽のときは、条件が真の値だけを `rtn[#rtn + 1]` で詰めていきます。キーは振り直され、配列になります。

```lua:line-numbers=322
  else
    for _, v in iter(t) do
      if fn(v) then rtn[#rtn + 1] = v end
    end
  end
```

## ここがすごい

- **同じ形の繰り返し**: キーを残す場合と残さない場合で、条件の判定は同じです。違うのは、どこに入れるかだけなので、読みやすくなっています。
- **元の表を変えない**: 結果は新しい表なので、元の表を使い続けられます。
- **種類の違いを吸収**: `getiter` で回し方を選ぶので、配列でも連想配列でも、同じ関数で扱えます。
- **注意点**: 残さない場合の結果は、配列として連続したキーになります。元の位置を知りたいときは、`retainkeys` を真にしてください。

## まとめ

- 要素を絞り込むときは、条件に通ったものだけを新しい表に入れると、元の表を壊さずに済む。
- キーを残すかどうかを引数で選ぶと、同じ関数で配列と連想配列の両方に対応できる。
- 結果の形（キーが振り直されるか）を、呼ぶ前に確かめておくと安心である。
