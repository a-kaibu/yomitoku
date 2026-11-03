---
title: 畳み込みで値を一つにまとめる reduce
description: Lua のユーティリティ集 lume の reduce。表の要素を順に関数へ渡し、最後に 1 つの値にまとめます。初期値を省いた場合は、最初の要素を初期値にします。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [288, 302]
format: 2
function: lume.reduce
difficulty: 2
tags: [関数型, イテレータ, イディオム]
---
## ひとことで

`lume.reduce(t, fn, first)` は、表 `t` の要素を左から順に畳み込んで、1 つの値にまとめる関数です。`fn(累積, 要素)` の形で、結果を次へ渡していきます。合計や最大値などを、ループを書かずに表すときに使います。

## コード

```lua:line-numbers=288
function lume.reduce(t, fn, first)
  local started = first ~= nil
  local acc = first
  local iter = getiter(t)
  for _, v in iter(t) do
    if started then
      acc = fn(acc, v)
    else
      acc = v
      started = true
    end
  end
  assert(started, "reduce of an empty table with no first value")
  return acc
end
```

## 前提知識

- **畳み込み（fold / reduce）**: 配列の要素を、先頭から 1 つずつ、累積の値と組み合わせて、最後に 1 つの値にする操作です。
- **初期値 `first`**: 累積の最初の値です。省略された場合は、表の最初の要素がその役目を持ちます。
- **`~= nil`**: 初期値が渡されたかを確かめる書き方です。`false` を初期値にしたい場合にも、正しく区別できます。
- **`assert`**: 条件が偽のときにエラーを起こす Lua の関数です。空の表と初期値なしの組み合わせを、ここで防ぎます。

## 何をしているか

### 1. 初期値が渡されたかを記録する

`started` は、累積の値がすでにあるかを表す真偽値です。初期値があれば最初から真です。

```lua:line-numbers=289
  local started = first ~= nil
  local acc = first
```

### 2. 最初の要素と、それ以降で処理を分ける

まだ始まっていなければ、要素をそのまま累積に入れて `started` を真にします。始まっていれば、`fn(acc, v)` で累積と要素をまとめます。

```lua:line-numbers=293
    if started then
      acc = fn(acc, v)
    else
      acc = v
      started = true
    end
```

### 3. 空のまま終わるなら止める

すべての要素を回しても `started` が偽のままなら、空の表で初期値もなかったことになります。`assert` でエラーを起こし、意味のない結果を返さないようにしています。

```lua:line-numbers=300
  assert(started, "reduce of an empty table with no first value")
  return acc
```

## ここがすごい

- **一つの関数で、すべての畳み込み**: 合計、積、最大値、文字列の連結などを、`fn` を変えるだけで表せます。
- **初期値の省略に対応**: 初期値を書かなくても、表の最初の値から始められます。呼ぶ側が書く量を減らせます。
- **空の表を明示的に扱う**: 何も返せない状況を、`nil` で黙って通さずに、エラーとして知らせます。
- **注意点**: 累積の値が `nil` になる関数を渡すと、次の回で壊れます。また、`started` は `nil` でない初期値で判定するので、`nil` を初期値に使うことはできません。

## まとめ

- 畳み込みは、累積の値と要素を一つずつまとめる、という一つの形で多くの処理を表せる。
- 初期値を省ける仕組みは、呼び出しを短くするが、空の表の扱いを決めておく必要がある。
- 空の表で意味のない結果を返さないように、エラーで知らせると安全である。
