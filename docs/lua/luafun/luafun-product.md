---
title: すべての値を掛け合わせる product
description: LuaJIT 向け関数型ライブラリ Lua Fun の product。列の値をすべて掛け合わせた積を返します。sum と同じ形で、掛け算の単位元 1 から始めます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [704, 712]
format: 2
function: product
difficulty: 1
tags: [数値計算, 関数型, イテレータ]
---
## ひとことで

`product(gen, param, state)` は、列のすべての値を掛け合わせた積を返す関数です。掛け算の単位元 `1` から始めて、値を一つずつ掛けていきます。`sum` の掛け算版にあたり、同じ形で書かれています。

## コード

```lua:line-numbers=704
local product = function(gen, param, state)
    local p = 1
    local r = 1
    repeat
        p = p * r
        state, r = gen(param, state)
    until state == nil
    return p
end
```

## 前提知識

- **単位元**: 演算の中で、何を掛けても、足しても、値を変えない数のことです。掛け算では `1`、足し算では `0` が単位元です。
- **畳み込み（fold）**: 列の値を一つずつまとめて、一つの値にする処理です。`product` は、掛け算で畳み込みをしています。
- **`repeat ... until`**: 列が終わるまで、少なくとも一度は繰り返す文です。
- **`sum` との対比**: `sum` は `0` から始めて足します。`product` は `1` から始めて掛けます。構造はほぼ同じです。

## 何をしているか

### 1. 積の初期値を決める

積 `p` を単位元の `1` で始めます。`r` は、直前に取り出した値を入れるための変数で、最初は `1` にしておきます。

```lua:line-numbers=705
    local p = 1
    local r = 1
```

### 2. 値を一つずつ掛けていく

`p = p * r` で、積に直前の値を掛けます。そのあとで、次の状態と値を列から取り出します。列が終わるまで、この繰り返しです。

```lua:line-numbers=707
    repeat
        p = p * r
        state, r = gen(param, state)
    until state == nil
```

### 3. 積を返す

列が終わったら、積 `p` を返します。

```lua:line-numbers=711
    return p
```

## ここがすごい

- **単位元から始める**: 最初の値を特別扱いせずに、`1` から掛けられます。空の列でも、正しく `1` を返せます。
- **`sum` と同じ形**: 足し算と掛け算で、構造が同じです。一つの形を覚えれば、ほかの畳み込みにも応用できます。
- **値は必要な分だけ**: 列は、一つずつ取り出されて掛けられます。大きな列でも、表を作らずに済みます。
- **注意点**: 値の中に `0` が一つでもあると、積は `0` になります。また、大きな値を掛けると、数の範囲を超えてしまうことがあります。

## まとめ

- 畳み込みは、演算の単位元から始めると、空の列にも自然に対応できる。
- 足し算と掛け算のような対になる処理は、同じ形で書けるので、覚えやすい。
- 数の範囲と、ゼロの影響は、計算を使う前に確かめておく。
