---
title: "昇順でも降順でも「すでに並んでいる区間」を見つける"
description: "Timsort の要の関数。配列の中の整列済み区間（ラン）を見つけ、降順なら後でひっくり返すために印を付ける。安定ソートのための細かい配慮が光る。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [476, 511]
function: "_findNextRun(in:from:by:)"
difficulty: 2
tags: [ソート, アルゴリズム, 標準ライブラリ]
---
## ひとことで

現実のデータは、まったくのランダムよりも「部分的に並んでいる」ことがよくあります。Timsort はこの性質を利用して、すでに並んでいる区間（ラン）を見つけ出し、そのまま使います。
`_findNextRun` は `start` の位置から始まるランの終わりを探し、そのランが **昇順か降順か** を返します。たとえば `[1, 3, 5, 4, 2]` を先頭から調べると、`[1, 3, 5]` が昇順のランです。

## コード

```swift:line-numbers=476
/// Returns the end of the next in-order run along with a Boolean value
/// indicating whether the elements in `start..<end` are in descending order.
///
/// - Precondition: `start < elements.endIndex`
@inlinable
internal func _findNextRun<C: RandomAccessCollection>(
  in elements: C,
  from start: C.Index,
  by areInIncreasingOrder: (C.Element, C.Element) throws -> Bool
) rethrows -> (end: C.Index, descending: Bool) {
  _internalInvariant(start < elements.endIndex)

  var previous = start
  var current = elements.index(after: start)
  guard current < elements.endIndex else {
    // This is a one-element run, so treating it as ascending saves a
    // meaningless call to `reverse()`.
    return (current, false)
  }

  // Check whether the run beginning at `start` is ascending or descending.
  // An ascending run can include consecutive equal elements, but because a
  // descending run will be reversed, it must be strictly descending.
  let isDescending =
    try areInIncreasingOrder(elements[current], elements[previous])
  
  // Advance `current` until there's a break in the ascending / descending
  // pattern.
  repeat {
    previous = current
    elements.formIndex(after: &current)
  } while try current < elements.endIndex &&
    isDescending == areInIncreasingOrder(elements[current], elements[previous])
    
  return(current, isDescending)
}
```

## 前提知識

- **ジェネリクス `<C: RandomAccessCollection>`**: 型 `C` を引数のように受け取る仕組みです。`RandomAccessCollection` は「添字で任意の位置にすぐアクセスできるコレクション」を表すプロトコル（インターフェースのようなもの）です。配列はこれに当てはまります。
- **`C.Index` / `C.Element`**: コレクションの添字の型と要素の型です。配列ならそれぞれ `Int` と中身の型です。
- **`areInIncreasingOrder: (C.Element, C.Element) throws -> Bool`**: 2 つの要素を受け取り「1 つ目が 2 つ目より前に来るべきなら true」を返す関数（クロージャ）を引数に取っています。
- **`throws` / `rethrows` / `try`**: `throws` はエラーを投げうる関数の印です。`rethrows` は「引数として渡されたクロージャがエラーを投げたときだけ、この関数もエラーを投げる」という意味です。`try` はエラーを投げうる呼び出しに付けます。
- **戻り値のタプル `(end: C.Index, descending: Bool)`**: 名前付きの 2 つ組を返しています。
- **`guard 条件 else { ... }`**: 条件が満たされないときに早期 return するための構文です。
- **`repeat { ... } while 条件`**: 少なくとも 1 回は本体を実行するループです（C の do-while）。
- **`formIndex(after: &current)`**: `current` を次の添字へ進めます。`&` は「この変数を書き換えてよい」という印（inout 引数）です。

## 何をしているか

`[1, 3, 5, 4, 2]` を `start = 0` から調べる場合で追います。比較関数は `<` とします。

### 1. 1 要素しか残っていない場合（488〜494 行目）

`previous = 0`、`current = 1` にします。もし `current` が末尾を越えていたら、ランは 1 要素だけです。このとき「昇順」として返します。1 要素を「降順だから反転」するのは無駄だからです（コメントにもそう書かれています）。

### 2. 向きを決める（499〜500 行目）

最初の 2 要素を比べます。`areInIncreasingOrder(elements[1], elements[0])` は `3 < 1` なので false。つまり **昇順** のランです。

ここで比べる順番が「後ろ, 前」であることに注目してください。「後ろの要素が前の要素より真に小さい」ときだけ降順とみなします。

### 3. 向きが変わるまで進める（504〜508 行目）

`repeat` ループで `current` を 1 つずつ進め、毎回「同じ比較をしたときに、最初と同じ答え（`isDescending`）になるか」を確かめます。

- `current = 2`: `5 < 3` は false。`isDescending`（false）と一致するので続行。
- `current = 3`: `4 < 5` は true。一致しないので終了。

結果は `(3, false)` です。`0..<3`、つまり `[1, 3, 5]` が昇順のランだとわかりました。

## ここがすごい

- **等しい要素の扱いで安定性を守る**: 497〜498 行目のコメントが核心です。昇順のランには「等しい要素が続く」ことを許しますが、降順のランは **厳密に** 降順でなければいけません。降順のランは後で反転されます。もし `[2, 2]` のような等しい要素を降順のランに入れて反転すると、等しい要素の順番が入れ替わってしまいます。Swift の `sort` は安定ソート（等しい要素の元の順番を保つソート）なので、これは許されません。比較の向きを「後ろ, 前」にしているのは、このためです。
- **比較 1 つで両方向を判定**: 昇順用・降順用の 2 本のループを書かず、`isDescending == areInIncreasingOrder(...)` という 1 つの式で「最初と同じ傾向が続いているか」を判定しています。コードが半分で済みます。
- **降順も無駄にしない**: 単純なマージソートは降順のデータに弱いことがあります。Timsort は降順のランを見つけたら反転して昇順のランにするので、`[5, 4, 3, 2, 1]` のような完全な逆順データも O(n) で並べ終わります。

## まとめ

- Timsort は「すでに並んでいる区間」を見つけて再利用することで、実データで速くなる。
- 降順のランを反転するなら、等しい要素を含めてはいけない。安定ソートでは比較の向き 1 つにまで気を配る。
- 「最初の比較結果と同じかどうか」で判定すれば、昇順・降順の両方を 1 本のループで扱える。
