---
title: 関数を並べて書ける、メタテーブルで作る chain
description: Lua の小さなユーティリティ集 lume の chain。lume の関数名をそのままメソッドとして使えるように、metatable の __index に関数を並べます。途中の値を持ち歩いて、最後に result で取り出します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [759, 767]
format: 2
function: lume.chain
difficulty: 3
tags: [メタプログラミング, 関数型, 設計パターン]
---

## ひとことで

`lume.chain(value)` は、値を包んで、`:map(...)` や `:filter(...)` のようにメソッドをつなげて書けるようにする関数です。途中の結果は値の中に持ち歩かれ、最後に `:result()` で取り出します。関数を「先頭の値を受け取るメソッド」に変えて並べる、というのが仕組みの中心です。

## コード

```lua:line-numbers=759
local chain_mt = {}
chain_mt.__index = lume.map(lume.filter(lume, iscallable, true),
  function(fn)
    return function(self, ...)
      self._value = fn(self._value, ...)
      return self
    end
  end)
chain_mt.__index.result = function(x) return x._value end
```

この表を使う `lume.chain` 本体も、読むのに必要なので引用します。

```lua:line-numbers=769
function lume.chain(value)
  return setmetatable({ _value = value }, chain_mt)
end
```

## 前提知識

- **metatable の `__index`**: テーブルに無いキーを探したときに見に行く表です。ここに関数を入れておくと、`chain` の値から、その関数をメソッドのように呼べます。
- **メソッド呼び出し `obj:f(...)`**: `obj.f(obj, ...)` と同じです。`obj` が最初の引数 `self` になります。
- **`lume.filter` と `lume.map`**: lume の関数を、配列や表に次々と適用する関数です。ここでは、lume の関数の一覧を作るために使われています。
- **`iscallable`**: 呼べる値（関数）かを調べる関数です。`lume` の中の関数だけを選ぶために使います。

## 何をしているか

### 1. lume の関数を、メソッドの形に変える

`lume.filter(lume, iscallable, true)` で、`lume` のうち関数である項目だけを取り出します。その 1 つ 1 つを `lume.map` で、「`self` を受け取り、途中の値を更新して、自分を返す」関数に変えます。

```lua:line-numbers=760
chain_mt.__index = lume.map(lume.filter(lume, iscallable, true),
```

```lua:line-numbers=762
    return function(self, ...)
      self._value = fn(self._value, ...)
      return self
    end
```

この形にすると、`chain(list):map(f):filter(g)` のように、同じ `self` が次々と渡されていきます。

### 2. 結果を取り出す関数を足す

`result` だけは、値を変えずに `_value` をそのまま返します。チェーンの最後に、これを呼んで答えを取り出します。

```lua:line-numbers=767
chain_mt.__index.result = function(x) return x._value end
```

### 3. 値を包む

`lume.chain(value)` は、`_value` を持つ表を作り、metatable に `chain_mt` を付けて返します。これで、その表から `:map` などを呼べるようになります。

## ここがすごい

- **既存の関数を自動でメソッドに変換する**: 関数を一覧にしてから変換するので、lume に新しい関数を足すと、チェーンでも自動的に使えます。書き手が 2 回手で書く必要がありません。
- **途中の値を持ち歩く**: 各メソッドは `_value` を更新して `self` を返すだけなので、呼び出しを連ねると、データが次の段へ自然に流れます。
- **metatable の仕組みを 1 つで使い回す**: `chain_mt.__index` という 1 つの表に、変換したすべてのメソッドを入れています。個々の値に関数を写すより、ずっと軽くなります。
- **注意点**: 各メソッドは元の値を書き換えるので、同じ `chain` を別々に使うと、途中の値が混ざります。新しい `chain` をそのたびに作ると安全です。

## まとめ

- 関数の並びをメソッド風に書きたいときは、metatable の `__index` に変換した関数を入れると実現できる。
- 途中の値を 1 つの表に持たせて、各段で更新すると、データが流れるように見える。
- 変換の仕組みを一覧から自動で作ると、関数を足すだけで機能も増える。
