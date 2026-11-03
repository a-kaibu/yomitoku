---
title: オブジェクトが「どのクラスの子か」を metatable の鎖でたどる
description: Lua の小さなクラス補助ライブラリ classic の is。オブジェクトの metatable を親の方向へたどり、指定したクラスが現れるかを調べます。
language: lua
project: classic
repo: https://github.com/rxi/classic
license: MIT
copyright: Copyright (c) 2014, rxi
commit: "e5610756c98ac2f8facd7ab90c94e1a097ecd2c6"
file: classic.lua
lines: [44, 53]
format: 2
function: Object:is
difficulty: 2
tags: [メタプログラミング, 設計パターン, アルゴリズム]
---

## ひとことで

`Object:is(T)` は、オブジェクトが `T` というクラス（またはその子孫）から作られたかを調べる関数です。`dog:is(Animal)` のように書くと、`dog` が `Animal` の子であれば `true` が返ります。クラスの仕組みを Lua の metatable で作っているので、その鎖をたどって答えを出します。

## コード

```lua:line-numbers=44
function Object:is(T)
  local mt = getmetatable(self)
  while mt do
    if mt == T then
      return true
    end
    mt = getmetatable(mt)
  end
  return false
end
```

## 前提知識

- **metatable**: テーブルの振る舞いを決める裏のテーブルです。`getmetatable(t)` で、`t` の metatable を取り出せます。
- **クラスとインスタンス**: `classic` では、インスタンスの metatable がクラスで、クラスの metatable が親です。この 2 段の鎖があるので、親をたどれます。
- **`while` ループ**: 条件が真の間、同じ処理を繰り返します。`mt` が `nil` になったら終わります。
- **`getmetatable(mt)`**: 今の metatable の、さらにその metatable を取り出します。これで 1 段ずつ親の方向へ進みます。

## 何をしているか

### 1. オブジェクトのクラスから調べ始める

`getmetatable(self)` で、このオブジェクトのクラスを取り出します。ここを出発点にして、親の方向へ進みます。

```lua:line-numbers=45
  local mt = getmetatable(self)
```

### 2. 一致するまで、親の方向へ進む

`while mt do` で、metatable がある限り繰り返します。`mt == T` なら、探しているクラスが見つかったので `true` を返します。見つからなければ、`getmetatable(mt)` で 1 段上の親へ進みます。

```lua:line-numbers=46
  while mt do
    if mt == T then
      return true
    end
    mt = getmetatable(mt)
  end
```

### 3. 最後まで見つからなければ `false`

鎖の終わり（親がなくなった状態）まで来たら、`false` を返します。

```lua:line-numbers=52
  return false
```

## ここがすごい

- **言語の仕組みをそのまま使う**: クラスの親子関係は、metatable の鎖として既に存在しています。その鎖をたどるだけで、`is` が実現できます。別の「親の一覧」を持つ必要がありません。
- **ループ 1 つで済む**: 深さがいくつでも、同じ 3 行の繰り返しで対応します。再帰を使うより、ループのほうが深い継承でも落ちにくいという利点があります。
- **トレードオフ**: 鎖をたどるのは、親が深いほど時間がかかります。ただし、ゲームの型判定などでは通常の深さは数段なので、実用上は問題になりにくいです。
- **注意点**: `classic` では、インスタンスの metatable がクラスそのものです。このため `dog:is(Dog)` は `true` になりますが、クラスをそのまま渡して `Dog:is(...)` と書くと、鎖の見方が違う点に注意が要ります。

## まとめ

- 親子関係が metatable の鎖で表されていれば、ループで親を順にたどって型判定ができる。
- 鎖の終わり（`nil`）を見て止めると、無限ループを防げる。
- 言語が既に持つ仕組みを使うと、余分なデータを持たずに済む。
