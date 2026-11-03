---
title: 先頭を飛ばした残りを、遅延して返す tail
description: LuaJIT 向け関数型ライブラリ Lua Fun の tail。イテレータの先頭の値を一つ読み捨て、残りを新しいイテレータとして返します。残りがなければ空のイテレータを返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [348, 354]
format: 2
function: tail
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`tail(gen, param, state)` は、イテレータの先頭の値を一つ読み捨てて、残りの値を新しいイテレータとして返す関数です。値は、まだ全部を計算せずに、必要になったときに一つずつ作られます。`fun.tail` は、リストの「先頭以外」を取り出すような場面で使います。

## コード

```lua:line-numbers=348
local tail = function(gen, param, state)
    state = gen(param, state)
    if state == nil then
        return wrap(nil_gen, nil, nil)
    end
    return wrap(gen, param, state)
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`（次を作る関数）、`param`（材料）、`state`（今の位置）の組です。Lua Fun の関数は、この組を受け取り、同じ形の組を返します。
- **遅延評価**: 値を、必要になるまで作らない考え方です。`tail` は、残りの値を先に全部作らず、`gen` を覚えておくだけです。
- **`nil` の意味**: 状態が `nil` になると、イテレータは終わりです。ここでは、その判定で空かどうかを決めています。
- **`wrap`**: 3 つ組を、Lua Fun の扱うイテレータの形にまとめる関数です。

## 何をしているか

### 1. 先頭の値を一つ読み捨てる

`gen(param, state)` を一回呼び、新しい状態を `state` に入れます。読み捨てた値は使わないので、その分だけ位置が進みます。

```lua:line-numbers=349
    state = gen(param, state)
```

### 2. 残りがなければ空にする

読み捨てた後の状態が `nil` なら、もう値がありません。空のイテレータ `nil_gen` を返します。

```lua:line-numbers=350
    if state == nil then
        return wrap(nil_gen, nil, nil)
    end
```

### 3. 残りを新しいイテレータとして返す

状態が残っていれば、同じ `gen` と `param` に、読み捨てた後の `state` を組にして返します。次に回したときは、二番目の値から始まります。

```lua:line-numbers=353
    return wrap(gen, param, state)
```

## ここがすごい

- **計算を後回しにする**: 残りの値を作るのは、回されたときだけです。大きな列の末尾を取り出しても、途中の値を全部作る必要がありません。
- **状態の受け渡しだけで済む**: 新しいイテレータは、元の `gen` と `param` を共有します。コピーを作らないので、軽く済みます。
- **空の場合を明示**: 残りがないときは、わざわざ `nil_gen` で空を表します。終わりの判定が、一か所で分かりやすくなっています。
- **注意点**: 同じイテレータを二回使うと、読み捨ての副作用が二回起きることがあります。状態を表す値を、使い回さない設計が大切です。

## まとめ

- 残りの列を取り出す処理は、状態を一つ進めた組を返すと、値を作らずに済む。
- 空の場合を専用のイテレータで表すと、後の処理で終わりを確かめやすい。
- 遅延の列は、同じ状態を二度使わないように、利用の仕方に気をつける。
