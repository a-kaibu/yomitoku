---
title: 関数の結果を無限に並べる tabulate
description: LuaJIT 向け関数型ライブラリ Lua Fun の tabulate。0 から始まる番号を関数に渡し、その結果を無限に並べたイテレータを作ります。値は必要なときに、一つずつ計算されます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [264, 267]
format: 2
function: tabulate
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`tabulate(fun)` は、関数 `fun` を使って、無限に続く列を作る関数です。列の番号は 0 から始まり、一つずつ増えます。その番号を `fun` に渡した結果が、列の値になります。二乗の列や、ある規則で作られる数の列を、遅延して表すために使えます。

## コード

```lua:line-numbers=264
local tabulate = function(fun)
    assert(type(fun) == "function")
    return wrap(duplicate_fun_gen, fun, 0)
end
```

## 前提知識

- **無限の列**: 終わりのない値の列です。`tabulate` は、値を全部作らず、必要なときに一つずつ作ります。
- **番号から値を作る**: 「何番目の値はこうなる」という規則を、関数として表す考え方です。列の値は、番号を入れると決まります。
- **`assert(type(fun) == "function")`**: 渡されたものが関数かを確かめます。関数でなければ、ここでエラーにします。
- **`wrap`**: 3 つ組のイテレータを、Lua Fun の扱う形にまとめる関数です。

## 何をしているか

### 1. 関数かどうかを確かめる

`fun` が関数であることを、`assert` で確かめます。関数でなければ、列を作る前にエラーになります。

```lua:line-numbers=265
    assert(type(fun) == "function")
```

### 2. 番号を 0 から数える列にする

`wrap(duplicate_fun_gen, fun, 0)` は、関数 `fun` と、数え始めの `0` を組にして、新しいイテレータを作ります。`duplicate_fun_gen` が、呼ばれるたびに番号を一つ進め、`fun` の結果を返します。

```lua:line-numbers=266
    return wrap(duplicate_fun_gen, fun, 0)
```

## ここがすごい

- **規則を関数で書ける**: 列の値を、表に並べる必要がありません。番号から値を作る規則だけを書けば、列が完成します。
- **無限でも安全**: 値は使われるまで作られないので、終わりのない列でも、先頭だけを取り出せます。
- **状態は番号だけ**: 状態として持つのは、今の番号一つです。少ない情報で、列の位置を管理できます。
- **注意点**: `fun` の中で副作用を起こすと、列を回すたびに副作用が起きます。純粋な計算だけを書くと、結果が予測しやすくなります。

## まとめ

- 規則で決まる列は、番号から値を作る関数として表すと、表を作らずに済む。
- 無限の列は、遅延して作ると、必要な分だけを安全に得られる。
- 副作用のない関数を渡すと、列の結果を予測しやすい。
