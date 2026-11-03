---
title: メソッドの宣言を登録し、子クラスへ伝える middleclass の仕組み
description: Lua のクラスライブラリ middleclass の _declareInstanceMethod。メソッドを宣言として記録し、値が nil なら親のメソッドを使い、そのうえで子クラスへ広げます。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [68, 76]
format: 2
function: _declareInstanceMethod
difficulty: 3
tags: [メタプログラミング, 設計パターン, 防御的プログラミング]
---

## ひとことで

`_declareInstanceMethod(aClass, name, f)` は、クラスに新しいメソッドを宣言するときに呼ばれる内部関数です。宣言を `__declaredMethods` という表に記録し、値が `nil` のときは親クラスのメソッドを使います。そのあと、子クラスへ変更を伝えます。

## コード

```lua:line-numbers=68
local function _declareInstanceMethod(aClass, name, f)
  aClass.__declaredMethods[name] = f

  if f == nil and aClass.super then
    f = aClass.super.__instanceDict[name]
  end

  _propagateInstanceMethod(aClass, name, f)
end
```

## 前提知識

- **宣言の記録**: 「このクラスが自分で定義したメソッド」を、`__declaredMethods` に分けて保存しています。
- **`nil` の代入**: ここでは、メソッドを消す、という意味で `nil` を使います。その場合は親のメソッドに戻します。
- **`_propagateInstanceMethod`**: 子クラスへメソッドを配る関数です。前の記事で説明したとおり、子が自分で定義していなければ変更が届きます。

## 何をしているか

### 1. 宣言を記録する

`aClass.__declaredMethods[name] = f` で、このクラスが自分で定義したメソッドとして記録します。この記録があるので、子クラスは自分の定義を親より優先できます。

```lua:line-numbers=69
  aClass.__declaredMethods[name] = f
```

### 2. 値が nil なら親の実装に戻す

`f` が `nil` で、親クラスがあるなら、親の `__instanceDict` にある同じ名前のメソッドを使います。つまり、宣言を取り消すと、親の振る舞いに戻ります。

```lua:line-numbers=71
  if f == nil and aClass.super then
    f = aClass.super.__instanceDict[name]
  end
```

### 3. 子クラスへ伝える

最後に `_propagateInstanceMethod` を呼び、決まったメソッドを子クラスへ配ります。

```lua:line-numbers=75
  _propagateInstanceMethod(aClass, name, f)
```


補足として、`_declareInstanceMethod` は、`__newindex` から呼ばれる関数です。つまり、利用者が `Dog.speak = function ... end` と書いたときに、ここが動きます。書き手は普通の代入の感覚でメソッドを足せますが、中では記録と配布が行われています。

## ここがすごい

- **宣言の記録と配布を分ける**: 「自分が定義したか」を記録する表と、実際のメソッドの表を分けているので、子が上書きしたかどうかを正しく判断できます。
- **`nil` で元に戻す**: 宣言を消すという操作を、親の実装へ戻す操作として扱います。特別なコードを増やさずに、継承の振る舞いを保てます。
- **注意点**: 親クラスにもメソッドがないと、`f` は `nil` のままになります。そのときは、子でも何も呼べなくなります。

## まとめ

- メソッドの宣言は、記録してから配ると、子クラスの上書きを守れる。
- 宣言を消すときは、親の実装に戻すと、継承の形を崩さずに済む。
