---
title: クラスの代入を横取りして、メソッドの宣言に変える仕掛け
description: Lua のクラスライブラリ middleclass の _createClass。クラスのテーブルに値を代入すると、メソッドとして宣言し直す __newindex を仕込みます。静的な値は static の表へ分けて保存します。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [81, 107]
format: 2
function: _createClass
difficulty: 3
tags: [メタプログラミング, 設計パターン, クロージャ]
---

## ひとことで

`_createClass(name, super)` は、middleclass のクラスの見た目を作る内部関数です。クラスのテーブルに `Dog.speak = function ... end` と代入すると、それは普通の値ではなく、インスタンスのメソッドとして登録されます。クラス自身の値（静的な値）は `static` という別の表に保存され、親クラスの値も探せるように、表を鎖でつなぎます。

## コード

```lua:line-numbers=81
local function _createClass(name, super)
  local dict = {}
  dict.__index = dict

  local aClass = { name = name, super = super, static = {},
                   __instanceDict = dict, __declaredMethods = {},
                   subclasses = setmetatable({}, {__mode='k'})  }

  if super then
    setmetatable(aClass.static, {
      __index = function(_,k)
        local result = rawget(dict,k)
        if result == nil then
          return super.static[k]
        end
        return result
      end
    })
  else
    setmetatable(aClass.static, { __index = function(_,k) return rawget(dict,k) end })
  end

  setmetatable(aClass, { __index = aClass.static, __tostring = _tostring,
                         __call = _call, __newindex = _declareInstanceMethod })

  return aClass
end
```

## 前提知識

- **`__newindex`**: テーブルに存在しないキーへ代入しようとしたときに動く metamethod です。ここでは `_declareInstanceMethod` が呼ばれ、代入を横取りします。
- **`__index`**: 存在しないキーを読んだときに動く metamethod です。`aClass.static` を見に行くようにしておくと、クラスの静的な値も読めます。
- **`__mode='k'`**: キーを弱い参照にするという指定です。子クラスの一覧（`subclasses`）が、子クラスを使わなくなったときに消えてよいようにするための仕掛けです。
- **`rawget`**: metatable を通さず、そのテーブルの値だけを見る関数です。

## 何をしているか

### 1. インスタンス用の表とクラスの表を作る

`dict` は、インスタンスが探すメソッドを入れる表です。`aClass` は、クラスそのものを表す表で、名前、親、静的な値の表、子クラスの一覧などを持ちます。

```lua:line-numbers=82
  local dict = {}
  dict.__index = dict
```

### 2. 親の有無で静的な値の探し方を決める

親がある場合、`static` の `__index` は、まず自分の `dict` を見て、なければ親の `static` を見に行きます。親がない場合は、`dict` だけを見ます。こうして、子は親の静的な値を引き継げます。

```lua:line-numbers=89
  if super then
```

```lua:line-numbers=96
        return result
```

### 3. クラスへの代入を宣言に変える

最後の `setmetatable(aClass, ...)` で、`__newindex = _declareInstanceMethod` を設定します。こうすると、`Dog.speak = ...` と書いたときは、値が `aClass` に入るのではなく、`_declareInstanceMethod` でメソッドとして登録されます。

```lua:line-numbers=103
  setmetatable(aClass, { __index = aClass.static, __tostring = _tostring,
                         __call = _call, __newindex = _declareInstanceMethod })
```

## ここがすごい

- **代入を宣言として扱える**: 普通の表への代入を横取りして、メソッドの登録に変えています。書き手は `function Dog:speak()` と同じ感覚で、メソッドを増やせます。
- **表を分けて役割を明確にする**: インスタンス用（`dict`）、静的な値（`static`）、クラス本体（`aClass`）を分けたので、同じ名前が混ざりません。
- **親子をつなぐ鎖**: 子の `static` は、見つからなければ親の `static` へ進みます。継承を、表の探し方だけで実現しています。
- **注意点**: 代入の横取りは、読むときの挙動を分かりにくくします。`Dog.x = 1` が、本当はどこに入ったかを追うのは大変です。使うときは、この仕組みを理解した上で使う必要があります。

## まとめ

- 代入を横取りする `__newindex` を使うと、書き方を宣言の形にできる。
- インスタンス用と静的な値の表を分けると、名前の衝突を避けられる。
- 親の表を `__index` で鎖にすると、継承を探し方だけで表せる。
