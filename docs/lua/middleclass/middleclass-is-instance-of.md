---
title: インスタンスが「そのクラスの子孫から作られたか」を一行で調べる
description: Lua のクラスライブラリ middleclass の isInstanceOf。インスタンスのクラスが指定クラスと同じか、その子孫かを、型の確認とあわせて判定します。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [129, 136]
format: 2
function: isInstanceOf
difficulty: 2
tags: [型システム, 設計パターン, 防御的プログラミング]
---

## ひとことで

`isInstanceOf(self, aClass)` は、オブジェクト `self` が、クラス `aClass`（またはその子孫）から作られたかを判定する関数です。`dog:isInstanceOf(Animal)` は、`dog` が `Dog` から作られ、`Dog` が `Animal` の子であれば `true` になります。Lua は `instanceof` のような演算子を持たないので、これを関数で用意しています。

## コード

```lua:line-numbers=129
  isInstanceOf = function(self, aClass)
    return type(aClass) == 'table'
       and type(self) == 'table'
       and (self.class == aClass
            or type(self.class) == 'table'
            and type(self.class.isSubclassOf) == 'function'
            and self.class:isSubclassOf(aClass))
  end,
```

## 前提知識

- **`self.class`**: middleclass では、インスタンスが自分を作ったクラスを `class` という名前で持っています。
- **`isSubclassOf`**: クラスが、別のクラスの子孫かを調べる関数です。`isInstanceOf` はこの関数を使って、親の方向の判定を任せています。
- **`and` と `or` の組み合わせ**: `and` は左から順に評価され、途中で偽になれば右側は調べません。`or` は、片方が真になれば終わりです。
- **型の確認**: `type(x) == 'table'` は、値がテーブルかを調べます。関数や数字をクラスとして渡された場合に、エラーを避けるために使います。

## 何をしているか

### 1. 引数がテーブルかを確かめる

`aClass` と `self` の両方がテーブルであることを確かめます。どちらかが数字や文字列なら、判定は `false` で終わります。

```lua:line-numbers=130
    return type(aClass) == 'table'
       and type(self) == 'table'
```

### 2. 同じクラスか、子孫かを調べる

`self.class == aClass` なら、直接そのクラスから作られています。違えば、`self.class` が `isSubclassOf` を持つかを確かめてから、その判定を呼びます。

```lua:line-numbers=132
       and (self.class == aClass
            or type(self.class) == 'table'
            and type(self.class.isSubclassOf) == 'function'
            and self.class:isSubclassOf(aClass))
```

`and` と `or` が混ざっているので、括弧で囲まれた部分の中で「同じか」か「子孫か」を見る形になっています。

## ここがすごい

- **演算子がなくても判定できる**: Lua には `instanceof` がありません。`self.class` を見て、既存の `isSubclassOf` に任せるだけで、同じ機能を関数として作っています。
- **防御的な確認が多い**: 途中の `type` の確認は、クラスがない、関数しか持っていない、といった誤った使い方でも落ちないようにしています。
- **判定の役割を分ける**: 「同じクラスか」は単純な比較で、「親か」は別の関数の仕事です。判定を分けたので、それぞれが短くなっています。
- **注意点**: 比べるクラスの順番は、`isInstanceOf(Animal)` のように、インスタンスを先に書く形です。逆に書くと意味が変わるので、呼び出し方に注意が要ります。

## まとめ

- 言語に `instanceof` がないときは、クラスを記録しておいて関数で判定すると同じことができる。
- 関数の中で型を確かめると、誤った引数でも安全に `false` を返せる。
- 同じクラスかの比較と、親をたどる判定を分けると、それぞれが読みやすくなる。
