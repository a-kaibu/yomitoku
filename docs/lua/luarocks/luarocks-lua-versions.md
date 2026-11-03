---
title: 対応する Lua のバージョンを、順番を選んで回るイテレータ
description: Lua のパッケージマネージャ LuaRocks の util.lua_versions。サポートする Lua のバージョン名を、昇順か降順で 1 つずつ返すイテレータを作ります。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [162, 177]
format: 2
function: util.lua_versions
difficulty: 1
tags: [イテレータ, 設計パターン, 可読性]
---

## ひとことで

`util.lua_versions(sort)` は、LuaRocks が扱う Lua のバージョン名（`"5.1"` から `"5.5"` まで）を順番に返すイテレータを作る関数です。`sort` に `"descending"` を渡すと、新しい版から古い版へ順に返します。何も渡さなければ、古い版から新しい版へ進みます。

## コード

```lua:line-numbers=162
function util.lua_versions(sort)
   local versions = { "5.1", "5.2", "5.3", "5.4", "5.5" }
   local i = 0
   if sort == "descending" then
      i = #versions + 1
      return function()
         i = i - 1
         return versions[i]
      end
   else
      return function()
         i = i + 1
         return versions[i]
      end
   end
end
```

## 前提知識

- **イテレータの作り方**: 状態を持つ関数を返すと、呼ぶたびに次の値が出てくるイテレータになります。ここでは `i` が状態です。
- **クロージャ**: 外側の変数 `i` を、返した関数が覚えて使い続けます。
- **`#versions`**: 配列の長さです。降順では、そこから 1 つ戻るように始めます。
- **`nil` の返却**: 配列の端を超えると `nil` が返り、`for` 文が終わります。

## 何をしているか

### 1. 昇順と降順で開始位置を変える

降順のときは `i` を配列の長さより 1 大きく始めます。昇順では `0` から始めます。どちらも、最初の呼び出しで正しい端の値が出るように工夫しています。

```lua:line-numbers=165
   if sort == "descending" then
      i = #versions + 1
```

### 2. 呼ぶたびに位置を動かす

降順の返す関数は、先に `i` を 1 減らしてから値を返します。昇順では、先に 1 増やしてから返します。

```lua:line-numbers=168
         i = i - 1
         return versions[i]
```

### 3. 端を超えたら自然に終わる

配列の外を指すと `versions[i]` は `nil` になります。`for ... in` は `nil` で止まるので、特別な終了処理は要りません。


補足として、このイテレータは `for version in util.lua_versions() do` の形で使えます。対応する Lua の一覧を順に調べる処理に、そのまま当てはまります。新しい版を先に試したいときは、降順を選ぶと、同じ書き方で向きだけが変わります。

## ここがすごい

- **向きを引数で切り替える**: 同じ形の関数を 2 通り作るだけで、昇順と降順の両方に対応しています。
- **終わりを `nil` に任せる**: 範囲の外に出たら `nil` が返るため、イテレータの終わりを明示的に書く必要がありません。
- **注意点**: 対応するバージョンを増やすときは、`versions` の表を直すだけで済みます。ただし、降順で始める位置は表の長さから決まるので、表の変更が自動で反映されます。

## まとめ

- 向きを決めて状態の初期値を変えると、同じ形で昇順と降順のイテレータを作れる。
- 配列の端を `nil` で表すと、`for` 文でそのまま回せる。
