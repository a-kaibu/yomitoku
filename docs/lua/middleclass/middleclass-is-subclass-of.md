---
title: 親をたどって「このクラスの子孫か」を判定する再帰
description: Lua のクラスライブラリ middleclass の isSubclassOf。クラスの親（super）を再帰的にたどり、指定したクラスが祖先にあるかを調べます。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [172, 176]
format: 2
function: isSubclassOf
difficulty: 2
tags: [再帰, 設計パターン, 型システム]
---

## ひとことで

`isSubclassOf(self, other)` は、あるクラス `self` が、別のクラス `other` の子孫かを判定する関数です。`Dog:isSubclassOf(Animal)` が `true` になるのは、`Dog` の親をたどると `Animal` があるときです。親が見つからなくなるまで、同じ問い合わせを 1 段ずつ上へ送ることで答えを出します。

## コード

```lua:line-numbers=172
    isSubclassOf = function(self, other)
      return type(other)      == 'table' and
             type(self.super) == 'table' and
             ( self.super == other or self.super:isSubclassOf(other) )
    end,
```

## 前提知識

- **`super`**: middleclass でクラスが持つ、親クラスへの参照です。`Dog.super` は `Animal` になります。最上位のクラスでは `super` がありません。
- **再帰呼び出し**: 関数が自分自身を呼ぶ書き方です。親の親、そのまた親、と同じ問いを繰り返すのに向いています。
- **`and` と `or` の短絡評価**: `and` の左側が偽なら右側は計算されず、`or` の左側が真なら右側は計算されません。この性質で、親がない場合の再帰を止めています。
- **`type(x) == 'table'`**: 値がテーブルかを確かめます。`super` が `nil` なら、ここで `false` になります。

## 何をしているか

### 1. 比べる相手がテーブルかを確かめる

`other` がテーブルでなければ、比べる意味がないので `false` になります。`self.super` がテーブルでないときも、親がないので `false` です。

```lua:line-numbers=173
      return type(other)      == 'table' and
             type(self.super) == 'table' and
```

### 2. 親そのものか、親の親かを確かめる

`self.super == other` なら、直接の親が探しているクラスです。違えば、`self.super:isSubclassOf(other)` を呼び、親の立場で同じ問いを続けます。

```lua:line-numbers=175
             ( self.super == other or self.super:isSubclassOf(other) )
```

たとえば `Puppy` → `Dog` → `Animal` の順に親があるとき、`Puppy:isSubclassOf(Animal)` は、`Dog` の判定へ送られ、さらに `Animal` を見つけて `true` になります。

## ここがすごい

- **1 つの問いを上へ送る**: 直接の親かどうかを見て、違えば親に同じ問いを任せます。どれだけ深い継承でも、同じ 2 行で済みます。
- **止まる条件が自然に入る**: 親がない（`super` が `nil`）場合は、`type(self.super) == 'table'` の段階で偽になり、再帰は終わります。無限に親をたどることはありません。
- **`or` で探索を短くする**: 直接の親が一致すれば、再帰を呼ばずに `true` になります。必要な分だけ上へたどります。
- **注意点**: 循環した親の関係を作ると、再帰が止まりません。通常の継承では起きないので、クラスの作り方に依存する前提です。

## まとめ

- 継承の関係を調べるには、親を 1 段ずつ上へたどる再帰が素直に書ける。
- 「親がない」という終わりの条件を、型の確認で自然に入れられる。
- `or` の短絡を使うと、必要なところで探索を止められる。
