---
title: "min と max は「等しいとき、どちらを返すか」まで決めている"
description: "いちばん単純に見える min と max。等しい値が渡されたとき min は 1 つ目、max は 2 つ目を返すように書き分けて、ソートの安定性を守っている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Algorithm.swift
lines: [19, 57]
function: "min(_:_:) / max(_:_:)"
difficulty: 1
tags: [イディオム, ジェネリクス, ソート, 標準ライブラリ]
---
## ひとことで

`min(3, 5)` は 3、`max(3, 5)` は 5。誰でも書けそうな関数ですが、Swift の標準ライブラリは **2 つが等しいときにどちらを返すか** をきちんと決めています。
`min` は等しければ 1 つ目の `x` を、`max` は等しければ 2 つ目の `y` を返します。こうすると `(min(x, y), max(x, y))` が、等しいときも必ず `(x, y)` の順番になります。

## コード

```swift:line-numbers=19
@inlinable // protocol-only
public func min<T: Comparable>(_ x: T, _ y: T) -> T {
  // In case `x == y` we pick `x`.
  // This preserves any pre-existing order in case `T` has identity,
  // which is important for e.g. the stability of sorting algorithms.
  // `(min(x, y), max(x, y))` should return `(x, y)` in case `x == y`.
  return y < x ? y : x
}

/// Returns the least argument passed.
///
/// - Parameters:
///   - x: A value to compare.
///   - y: Another value to compare.
///   - z: A third value to compare.
///   - rest: Zero or more additional values.
/// - Returns: The least of all the arguments. If there are multiple equal
///   least arguments, the result is the first one.
@inlinable // protocol-only
public func min<T: Comparable>(_ x: T, _ y: T, _ z: T, _ rest: T...) -> T {
  var minValue = min(min(x, y), z)
  // In case `value == minValue`, we pick `minValue`. See min(_:_:).
  for value in rest where value < minValue {
    minValue = value
  }
  return minValue
}

/// Returns the greater of two comparable values.
///
/// - Parameters:
///   - x: A value to compare.
///   - y: Another value to compare.
/// - Returns: The greater of `x` and `y`. If `x` is equal to `y`, returns `y`.
@inlinable // protocol-only
public func max<T: Comparable>(_ x: T, _ y: T) -> T {
  // In case `x == y`, we pick `y`. See min(_:_:).
  return y >= x ? y : x
}
```

## 前提知識

- **`public func`**: モジュールの外から使える関数です。`min` と `max` はどこからでも呼べる「グローバル関数」です。
- **ジェネリクス `<T: Comparable>`**: `T` は任意の型ですが、`Comparable`（`<` で大小比較ができる）というプロトコルに準拠している必要があります。`Int` も `String` も `Double` も `Comparable` です。
- **`_ x: T`**: 引数名の前の `_` は「呼び出すときに引数ラベルを書かなくてよい」という意味です。だから `min(x: 3, y: 5)` ではなく `min(3, 5)` と書けます。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B。
- **可変長引数 `T...`**: 3 つ以上の値を渡せる版（同じファイルの 38 行目）で使われています。
- **「同一性（identity）」**: 値が等しくても「別の物」であることがあります。たとえば `id` は違うが `score` が同じ 2 人のユーザーを `score` で比べると、比較上は等しいが別人です。

## 何をしているか

### min（20〜26 行目）

`return y < x ? y : x` は、「`y` が `x` より **真に小さい** ときだけ `y`、それ以外は `x`」です。等しいときは `x` が返ります。

`return x < y ? x : y` と書くと、等しいときに `y` が返ってしまいます。比較の向きを逆にしているのがポイントです。

### max（54〜57 行目）

`return y >= x ? y : x` は、「`y` が `x` 以上なら `y`」です。等しいときは `y` が返ります。

## ここがすごい

- **ソートの安定性につながる**: 2 要素を並べ替えるとき、`(min(a, b), max(a, b))` と書くのはよくある方法です。もし等しいときに `min` も `max` も `x` を返したら、結果は `(x, x)` になり、`y` が消えてしまいます。等しいときに `min` は前、`max` は後ろを返すので、結果は `(x, y)` のまま。元の順番を保つ（安定）ことになります。
- **NaN（非数）でも振る舞いが決まる**: `Double.nan` はどんな比較でも false になります。`min(x, .nan)` では `y < x` が false なので `x` が返ります。比較の書き方 1 つで、こうした特殊な値への振る舞いも決まります（浮動小数点には別途 `Double.minimum` があります）。
- **コメントで理由を残す**: 21〜24 行目のコメントは、なぜこの書き方なのかを具体的に説明しています。一見どちらでもよさそうなコードほど、意図を書いておかないと誰かが「整理」して壊してしまいます。

素直に `x < y ? x : y` と書いた `min` と、`x > y ? x : y` と書いた `max` を組み合わせると、等しいときにどちらも `y` を返すため、上の問題が起きます。

## まとめ

- 「等しいときにどちらを返すか」も API の仕様の一部。
- `min` は等しければ前、`max` は等しければ後ろを返すと、2 つを組み合わせたときに順番が保たれる。
- 自明に見える書き方の選択には、理由をコメントで残しておく。
