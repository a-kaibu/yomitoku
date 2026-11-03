---
title: 値を探して、最初に見つかったキーを返す find
description: Lua のユーティリティ集 lume の find。表の中から等しい値を探し、最初に見つかったキーを返します。見つからなければ nil を返します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [376, 382]
format: 2
function: lume.find
difficulty: 1
tags: [探索, イテレータ, データ構造]
---
## ひとことで

`lume.find(t, value)` は、表 `t` の中で値 `value` を探し、最初に見つかったキーを返す関数です。配列なら位置、連想配列なら対応するキーが返ります。見つからなければ `nil` を返します。「この値はどこにあるか」を知りたいときに使います。

## コード

```lua:line-numbers=376
function lume.find(t, value)
  local iter = getiter(t)
  for k, v in iter(t) do
    if v == value then return k end
  end
  return nil
end
```

## 前提知識

- **`==` による比較**: Lua では、数や文字列は値の内容で比べられます。表どうしは、中身ではなく同じ実体かどうかで比べられます。
- **キーと値の組**: 表は、キーと値の組の集まりです。配列も、整数のキーを持つ表として扱われます。
- **線形探索**: 先頭から一つずつ調べる探し方です。表が大きいと時間がかかりますが、表の形を問わず使えます。
- **`return` による途中終了**: 見つかった時点で `return` すると、関数はその場で終わります。

## 何をしているか

### 1. 表を回す準備をする

`getiter(t)` で、表を回すための関数を取り出します。配列でも連想配列でも、同じ書き方で回せるようにするためです。

```lua:line-numbers=377
  local iter = getiter(t)
```

### 2. 一致した最初のキーを返す

キーと値の組を一つずつ受け取り、`v == value` になったら、すぐに `k` を返します。途中で見つかれば、残りの要素は調べません。

```lua:line-numbers=378
  for k, v in iter(t) do
    if v == value then return k end
  end
```

### 3. 見つからなければ nil

最後まで調べても一致しなければ、`nil` を返します。「見つからなかった」ことは、戻り値の `nil` で表します。

```lua:line-numbers=381
  return nil
```

## ここがすごい

- **最初の一致で止まる**: 見つけた時点で `return` するので、無駄な探索をしません。
- **キーを返す**: 値そのものではなく、その場所を返すので、後で同じ位置を書き換えたり、削除したりできます。
- **表の種類を選ばない**: `getiter` が回し方を決めるので、配列でも連想配列でも同じように探せます。
- **注意点**: `nil` は、見つかった値としては扱えません。また、表の中に同じ値が複数あると、一番先のキーだけが返ります。全部の位置が必要なら、`lume.filter` を使ってください。

## まとめ

- 値の位置を探すときは、見つけた時点で返すと、探索を短く済ませられる。
- キーを返すと、その位置を使った後続の処理を書きやすい。
- 見つからないときの戻り値を `nil` と決めておくと、呼び出し側の判定が簡単になる。
