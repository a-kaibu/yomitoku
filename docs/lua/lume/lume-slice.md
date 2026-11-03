---
title: 負の位置を末尾からの数として読む、slice の範囲の決め方
description: Lua の小さなユーティリティ集 lume の slice。開始と終了の位置を、負の数なら末尾からの位置として読み替え、範囲をはみ出さないように切り取ります。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [413, 421]
format: 2
function: lume.slice
difficulty: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`lume.slice(t, i, j)` は、配列 `t` の `i` 番目から `j` 番目までを切り出して、新しい配列にして返す関数です。`i` や `j` に負の数を渡すと、末尾から数えた位置として扱われます。`-1` は最後の要素を表します。範囲が配列の外にはみ出しても、安全に切り取ります。

## コード

```lua:line-numbers=413
function lume.slice(t, i, j)
  i = i and absindex(#t, i) or 1
  j = j and absindex(#t, j) or #t
  local rtn = {}
  for x = i < 1 and 1 or i, j > #t and #t or j do
    rtn[#rtn + 1] = t[x]
  end
  return rtn
end
```

負の位置を正の位置に直す `absindex` も、読むのに必要なので引用します。

```lua:line-numbers=47
local absindex = function(len, i)
  return i < 0 and (len + i + 1) or i
end
```

## 前提知識

- **Lua の添字**: 配列の位置は 1 から始まります。`#t` は最後の位置です。
- **負の添字**: Python のように、末尾から数える書き方です。`-1` は最後、`-2` はその 1 つ前を指します。
- **`and` と `or` の分岐**: `a and b or c` は、`a` が真なら `b`、そうでなければ `c` を返します。

## 何をしているか

### 1. 負の位置を正の位置に直す

`absindex(#t, i)` は、`i` が負なら `#t + i + 1` を返します。`i` が `-1` なら、長さの位置になり、最後の要素を指します。

```lua:line-numbers=414
  i = i and absindex(#t, i) or 1
```

### 2. 終わりの位置も同じように直す

終わりの `j` が省略されたら、配列の長さを使います。指定されていれば、同じように負の数を直します。

```lua:line-numbers=415
  j = j and absindex(#t, j) or #t
```

### 3. 範囲をはみ出さずに切り取る

`for x = i < 1 and 1 or i, j > #t and #t or j` は、開始を 1 より前にしない、終わりを長さより後にしない、という制限を付けています。その範囲の値を、新しい配列に順に入れます。

## ここがすごい

- **同じ関数で末尾からも指定できる**: 負の数で、末尾からの範囲を書けます。`lume.last` のような関数も、この仕組みを使って 1 行で書けます。
- **はみ出しを防ぐ**: 範囲の端を配列の内側に収めるので、存在しない位置を読んでエラーになりません。
- **元の配列を変えない**: 新しい配列に写すので、切り出しの結果を変えても、元の配列はそのままです。
- **注意点**: 開始が終了より後ろの場合、結果は空になります。範囲の順番は、呼ぶ側が正しく決めてください。

## まとめ

- 負の位置を末尾からの数として扱うと、範囲の指定が短く書ける。
- 範囲の端を配列の内側に収めると、はみ出しによるエラーを防げる。
