---
title: 配列を後ろから回る、ipairs の逆向きイテレータ
description: Lua の小さなユーティリティ集 lume の ripairs。配列の末尾から先頭へ向かって値を返すイテレータです。取り除きながら回るときに、番号がずれない書き方として使えます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [724, 734]
format: 2
function: lume.ripairs
difficulty: 2
tags: [イテレータ, データ構造, 可読性]
---

## ひとことで

`lume.ripairs(t)` は、配列を後ろから先頭へ向かって、番号と値の組を返す `for` 文用のイテレータを作る関数です。`for i, v in lume.ripairs(t) do` と書くと、最後の要素から順に処理できます。Lua 標準の `ipairs` を逆にしたものです。

## コード

```lua:line-numbers=724
local ripairs_iter = function(t, i)
  i = i - 1
  local v = t[i]
  if v ~= nil then
    return i, v
  end
end

function lume.ripairs(t)
  return ripairs_iter, t, (#t + 1)
end
```

## 前提知識

- **ジェネリックな `for`**: `for 変数1, 変数2 in 関数, 状態, 初期値 do` の形で、イテレータを回す Lua の文法です。`lume.ripairs` は、この 3 つを返しています。
- **`ipairs`**: 配列を先頭から 1 つずつ回す標準関数です。`1` から始まり、値が `nil` になるまで続きます。
- **状態と初期値**: イテレータは「今の状態」を受け取り、次の番号を返します。`ripairs` では、番号そのものが状態になっています。
- **`#t`**: 配列の長さです。末尾から回るときの出発点として使います。

## 何をしているか

### 1. イテレータの本体は番号を 1 つ減らす

`ripairs_iter` は、受け取った番号 `i` を 1 つ減らします。そして `t[i]` を取り出し、値があれば番号と値を返します。値が `nil` になった時点で、何も返さずに終わります。

```lua:line-numbers=725
  i = i - 1
  local v = t[i]
  if v ~= nil then
    return i, v
  end
```

### 2. 出発点は長さより 1 つ大きい番号

`lume.ripairs` は、`ripairs_iter`、`t`、`(#t + 1)` の 3 つを返します。最初に `i` が `#t + 1` として渡され、イテレータの 1 回目の呼び出しで `#t` になります。つまり、最後の要素から回り始めます。

```lua:line-numbers=733
  return ripairs_iter, t, (#t + 1)
```

## ここがすごい

- **状態を番号だけで表す**: 次の値を作るための情報は番号だけです。余分なカウンタやコピーがいらず、とても軽い設計です。
- **出発点を 1 つ大きくする工夫**: 「減らしてから取る」形にしたので、最初の呼び出しで最後の要素が取れます。開始点を特別扱いしない書き方になっています。
- **番号が正しい値になる**: 後ろから回るので、要素を削除しても、まだ回っていない前の要素の番号はずれません。前から回りながら削除すると、1 つずつずれてしまう問題を避けられます。
- **注意点**: 途中に `nil` の穴がある配列では、そこで止まります。`ipairs` と同じく、値が連続している前提で使うと安全です。

## まとめ

- 配列を後ろから回るには、番号を減らしていくイテレータを作ると簡単に書ける。
- 「減らしてから取る」形にすると、開始点を特別扱いしなくて済む。
- 後ろから回りながら削除すると、まだ回っていない要素の番号がずれない。
