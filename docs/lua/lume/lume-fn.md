---
title: 最初の引数だけ固定する fn、部分適用の仕組み
description: Lua のユーティリティ集 lume の fn。関数に先に引数を固定しておき、残りの引数を後から渡せる新しい関数を作ります。部分適用と呼ばれる手法です。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [468, 475]
format: 2
function: lume.fn
difficulty: 2
tags: [クロージャ, 関数型, イディオム]
---
## ひとことで

`lume.fn(fn, ...)` は、関数 `fn` に、先に決めておく引数を固定した、新しい関数を作る関数です。後から呼ぶときは、残りの引数だけを渡せば済みます。同じ引数を毎回書く手間を省くための、部分適用という手法です。

## コード

```lua:line-numbers=468
function lume.fn(fn, ...)
  assert(iscallable(fn), "expected a function as the first argument")
  local args = { ... }
  return function(...)
    local a = lume.concat(args, { ... })
    return fn(unpack(a))
  end
end
```

## 前提知識

- **部分適用**: 関数の引数の一部を先に渡し、残りの引数を待つ新しい関数を作ることです。
- **可変長引数 `...`**: 関数に、いくつでも引数を渡せる書き方です。`{ ... }` で、引数を表にまとめられます。
- **`lume.concat`**: 複数の表を、順に一本の配列へつなぐ lume の関数です。固定した引数と、後から来た引数を、一つにつなぐために使います。
- **`unpack`**: 配列の要素を、複数の引数として展開する関数です。Lua の版によって、`table.unpack` と呼ばれることもあります。

## 何をしているか

### 1. 判定と、固定する引数を用意する

`assert(iscallable(fn), ...)` で、渡されたものが関数か確かめます。`{ ... }` で、先に固定する引数を表 `args` にまとめます。

```lua:line-numbers=469
  assert(iscallable(fn), "expected a function as the first argument")
  local args = { ... }
```

### 2. 後から来た引数をつなぐ

返される関数は、呼ばれたときに受け取った引数 `...` と、固定しておいた `args` を `lume.concat` でつなぎます。固定した引数が先頭に、後から来たものが後ろに並びます。

```lua:line-numbers=471
  return function(...)
    local a = lume.concat(args, { ... })
```

### 3. つないだ引数で元の関数を呼ぶ

つないだ表を `unpack` で展開し、元の `fn` に渡して、その結果を返します。

```lua:line-numbers=473
    return fn(unpack(a))
```

## ここがすごい

- **呼び出しが短くなる**: 毎回同じ引数を書かずに、残りの引数だけを渡せます。よく使う組み合わせを、名前をつけて再利用できます。
- **引数の順番が決まる**: 固定した引数が先に、後の引数が続くので、呼び出しの順番がはっきりしています。
- **元の関数を変えない**: `fn` は書き換えず、包んだ新しい関数を作るだけです。元の関数は、そのまま使えます。
- **注意点**: 固定した引数は、表のまま保持されます。表の中身を後で変えると、以降の呼び出しに影響します。

## まとめ

- 同じ引数を繰り返し使うときは、部分適用で固定すると、呼び出しの書き方を簡単にできる。
- 固定する引数と後から渡す引数の順番を決めておくと、読み違いを防げる。
- 包んだ関数は元の関数を変えないので、安心して組み合わせて使える。
