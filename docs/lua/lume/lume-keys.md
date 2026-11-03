---
title: 表のキーを一覧にする、keys の 4 行
description: Lua のユーティリティ集 lume の keys。表のキーを順に集めて、新しい配列にして返します。キーを回す関数を、呼び出し側が選べる作りです。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [453, 458]
format: 2
function: lume.keys
difficulty: 1
tags: [データ構造, イテレータ, 標準ライブラリ]
---
## ひとことで

`lume.keys(t)` は、表 `t` のキーだけを集めて、新しい配列として返す関数です。`pairs` の順番に従うので、キーの並びは決まっていません。値は取らず、キーだけを欲しいときに使います。

## コード

```lua:line-numbers=453
function lume.keys(t)
  local rtn = {}
  local iter = getiter(t)
  for k in iter(t) do rtn[#rtn + 1] = k end
  return rtn
end
```

## 前提知識

- **キーと値**: Lua の表は、キーと値の組の集まりです。配列も、整数のキーを持つ表として扱われます。
- **`getiter`**: 表の種類に応じて、回すための関数を選ぶ lume の内部の仕組みです。
- **`rtn[#rtn + 1]`**: 配列の末尾に、1 つ追加する書き方です。`#rtn` が現在の長さなので、次の位置が分かります。
- **`for k in iter(t)`**: 1 つだけ変数を書くと、`iter` が返す最初の値、つまりキーだけを受け取ります。

## 何をしているか

### 1. 結果を入れる表と、回す関数を用意する

```lua:line-numbers=454
  local rtn = {}
  local iter = getiter(t)
```

`rtn` は空の配列です。`getiter(t)` で、表を回すための関数 `iter` を取り出します。

### 2. キーを末尾に足していく

```lua:line-numbers=456
  for k in iter(t) do rtn[#rtn + 1] = k end
```

`for k in iter(t)` で、キーを一つずつ受け取ります。`rtn[#rtn + 1] = k` で、配列の末尾に加えていきます。値は受け取らないので、キーだけの配列になります。

### 3. 配列を返す

```lua:line-numbers=457
  return rtn
```

すべてのキーを足し終わったら、`rtn` を返します。元の表は変わりません。

## ここがすごい

- **とても短い**: 4 行の中に、回す、足す、返す、の 3 つだけがあります。読んだ人が、すぐに中身を理解できます。
- **回す関数を差し替えられる**: `getiter` を経由するので、配列でも、別の種類の表でも、同じ手順で扱えます。
- **元の表を変えない**: 結果は新しい配列なので、キーを集めた後に、元の表を書き換えても問題ありません。
- **注意点**: キーの並びは `pairs` の順番なので、毎回同じとは限りません。並び順が必要なら、結果を `table.sort` で並べ直してください。

## まとめ

- キーだけを集めるときは、回しながら末尾に足す書き方が最も分かりやすい。
- 回す関数を一か所にまとめると、表の種類が変わっても同じ手順で済む。
- 順番が必要なら、集めた後で並べ直す。
