---
title: 元を変えずに並べ替える、比較の仕方を 3 通りに切り替える sort
description: Lua の小さなユーティリティ集 lume の sort。配列を複製してから並べ替えます。比較の指定が文字列なら、その名前のキーで比べ、関数なら、その関数で比べます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [226, 238]
format: 2
function: lume.sort
difficulty: 2
tags: [ソート, 型システム, 関数型]
---

## ひとことで

`lume.sort(t, comp)` は、配列 `t` を並べ替えた新しい配列を返す関数です。元の配列は変わりません。`comp` を省略すると標準の順番、文字列なら、その名前のキーの値で比べます。関数なら、その関数の結果で並べます。

## コード

```lua:line-numbers=226
function lume.sort(t, comp)
  local rtn = lume.clone(t)
  if comp then
    if type(comp) == "string" then
      table.sort(rtn, function(a, b) return a[comp] < b[comp] end)
    else
      table.sort(rtn, comp)
    end
  else
    table.sort(rtn)
  end
  return rtn
end
```

## 前提知識

- **`table.sort`**: 配列を並べ替える標準関数です。比較関数を渡すと、その基準で並べます。
- **比較関数**: 「a は b より前か」を答える関数です。`true` なら `a` を前に置きます。
- **`lume.clone`**: 表を複製する lume の関数です。並べ替えの前にコピーを作ることで、元が壊れません。
- **キーで比べる**: 表の要素がレコードのとき、特定のキー（例えば `"age"`）の値で比べる、という意味です。

## 何をしているか

### 1. 元を守るために複製する

`lume.clone(t)` で、配列の複製を作ります。以降の並べ替えは、この複製に対して行います。

```lua:line-numbers=227
  local rtn = lume.clone(t)
```

### 2. 文字列なら、そのキーで比べる

`comp` が文字列なら、`a[comp] < b[comp]` で比べる関数を作って並べます。たとえば `"age"` と書けば、各要素の `age` の値で並べ替えられます。

```lua:line-numbers=230
      table.sort(rtn, function(a, b) return a[comp] < b[comp] end)
```

### 3. 関数ならそのまま、なければ標準の順番

`comp` が関数なら、それを `table.sort` に渡します。`comp` がなければ、`table.sort(rtn)` で標準の順番に並べます。


補足として、`sort` は並べ替えの基準を変えるだけで、同じ書き方を保てます。レコードの並べ替えでは、`lume.sort(people, "age")` のように書けば、年齢順になります。より複雑な基準が必要なら、比較関数を渡すと、名前の順と年齢の順のような組み合わせも書けます。

## ここがすごい

- **3 通りの指定を 1 つの関数で扱う**: キー名、比較関数、省略の 3 つを、同じ `comp` という引数で受け取ります。使う側が、書きやすい形を選べます。
- **元を壊さない**: 複製してから並べるので、並べ替えの結果を使っても、元の配列の順番は変わりません。
- **注意点**: キーで比べるとき、そのキーが無い要素があると、`nil` との比較でエラーになります。全要素がキーを持つことを確かめてから使ってください。

## まとめ

- 並べ替えは、複製に対して行うと、元の配列を守れる。
- 比較の指定を文字列や関数で選べるようにすると、呼ぶ側の書き方が広がる。
- キーで比べるときは、すべての要素がそのキーを持つかを確かめる。
