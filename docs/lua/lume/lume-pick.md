---
title: 指定したキーだけを取り出して、新しい表にする pick
description: Lua の小さなユーティリティ集 lume の pick。キーの名前を複数渡すと、その項目だけを持つ新しい表を作ります。元の表に無いキーは、nil のまま残ります。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [443, 450]
format: 2
function: lume.pick
difficulty: 1
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`lume.pick(t, ...)` は、表 `t` から、指定したキーの項目だけを取り出して新しい表を作る関数です。`lume.pick(user, "name", "age")` は、名前と年齢だけを持つ表になります。大きな表から、必要な項目だけを抜き出すときに役立ちます。

## コード

```lua:line-numbers=443
function lume.pick(t, ...)
  local rtn = {}
  for i = 1, select("#", ...) do
    local k = select(i, ...)
    rtn[k] = t[k]
  end
  return rtn
end
```

## 前提知識

- **可変長引数 `...`**: 関数に渡された値をすべて表します。`select("#", ...)` で数を、`select(i, ...)` で `i` 番目を取り出せます。
- **表のキー**: 文字列などの値で、項目を探す場所です。
- **`nil` の項目**: 元の表に無いキーを指定すると、`t[k]` は `nil` です。その項目は、新しい表にも入りません。

## 何をしているか

### 1. 指定されたキーを 1 つずつ取り出す

`select(i, ...)` で、指定されたキーを先頭から取り出します。

```lua:line-numbers=445
  for i = 1, select("#", ...) do
    local k = select(i, ...)
```

### 2. 元の表の値を写す

`rtn[k] = t[k]` で、同じキーの値を新しい表に写します。元の表にその値が無ければ、何も入りません。

```lua:line-numbers=447
    rtn[k] = t[k]
```

## ここがすごい

- **必要な項目だけ抜き出せる**: 大きな表から、表示や保存に必要な項目だけを、名前で指定して取り出せます。
- **元の表を変えない**: 新しい表を作るので、取り出した後も元の表は使い続けられます。
- **注意点**: 元の表にない名前は、何も入らずに黙って無視されます。名前が正しいかを確かめたい場合は、別に検査が必要です。

## まとめ

- 必要な項目だけを残すには、キーの名前を並べて新しい表を作ると分かりやすい。
- 存在しないキーは黙って無視されるので、必要なら呼ぶ側で確かめる。
