---
title: "テーブルごとにハッシュのシードを変えて「2 乗の罠」を防ぐ"
description: "ハッシュテーブルを作るたびに違うシードを選ぶ関数。オブジェクトのアドレスをシードにすることで、乱数生成より安く、同時に存在するテーブル同士でシードがかぶらないようにする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/HashTable.swift
lines: [108, 132]
function: "_HashTable.hashSeed(for:scale:)"
difficulty: 3
tags: [ハッシュ, 最適化, データ構造, 標準ライブラリ]
---
## ひとことで

Swift の `Dictionary` や `Set` は、テーブルごとに **ハッシュのシード（ハッシュ値を計算するときに混ぜる値）** を持っています。同じキーでも、テーブルが違えば入る位置が変わります。
`hashSeed(for:scale:)` はそのシードを決める関数で、テーブルのメモリの **アドレス** をそのままシードにします。なぜそんなことをするのかは、この部分コメントに書かれています。

## コード

```swift:line-numbers=108
  internal static func hashSeed(
    for object: Builtin.NativeObject,
    scale: Int8
  ) -> Int {
    // We generate a new hash seed whenever a new hash table is allocated and
    // whenever an existing table is resized, so that we avoid certain copy
    // operations becoming quadratic. For background details, see
    // https://github.com/apple/swift/issues/45856.
    //
    // Note that we do reuse the existing seed when making copy-on-write copies
    // so that we avoid breaking value semantics.
    if Hasher._isDeterministic {
      // When we're using deterministic hashing, the scale value as the seed is
      // still allowed, and it covers most cases. (Unfortunately some operations
      // that merge two similar-sized hash tables will still be quadratic.)
      return Int(scale)
    }
    // Use the object address as the hash seed. This is cheaper than
    // SystemRandomNumberGenerator, while it has the same practical effect.
    // Addresses aren't entirely random, but that's not the goal here -- the
    // 128-bit execution seed takes care of randomization. We only need to
    // guarantee that no two tables with the same seed can coexist at the same
    // time (apart from copy-on-write derivatives of the same table).
    return unsafe unsafeBitCast(object, to: Int.self)
  }
```

## 前提知識

- **ハッシュのシード**: ハッシュ関数に混ぜる追加の値です。同じキーでも、シードが違えばハッシュ値が変わります。
- **`Builtin.NativeObject`**: 標準ライブラリ内部で使う「参照カウントされるオブジェクト」の型です。ここではハッシュテーブルの記憶領域を指します。
- **`unsafeBitCast(object, to: Int.self)`**: 値のビットをそのまま別の型として解釈します。オブジェクトの参照（アドレス）を整数として取り出しています。
- **`Hasher._isDeterministic`**: テストなどのために「毎回同じハッシュ値にする」モードかどうかです。環境変数で切り替えられます。
- **コピーオンライト（copy-on-write）**: Swift の配列や辞書は、コピーしても実際には中身を共有しておき、書き換えるときに初めて複製します。

## 何をしているか

### 1. 決定的モードの場合（この部分）

テストでは毎回同じ結果が欲しいので、ランダムな値は使えません。代わりに `scale`（テーブルの大きさの指数）をシードにします。大きさが違えばシードも違うので、多くの場合はこれで十分です。

### 2. ふだんの場合（この部分）

テーブルの記憶領域のアドレスを `Int` として返します。同時に存在する 2 つのテーブルが、同じアドレスを持つことはありません。だから、シードがかぶることもありません。

## ここがすごい

- **「2 乗の罠」とは**: 辞書 A のキーを順番に取り出して、新しい辞書 B に入れていくとします。もし A と B が同じシードを使っていると、A の中で「隣り合っていたキー」は B でも隣り合う位置に入ろうとします。B は小さいうちは A の前半部分にキーが集中し、オープンアドレス法の探索が長い列になります。その結果、本来 O(n) の処理が O(n²) になってしまいます。テーブルごとにシードを変えれば、キーの並び方が毎回シャッフルされるので、この問題は起きません（この部分リンク先の課題）。
- **乱数ではなくアドレスを使う**: 「テーブルごとに違う値」が欲しいだけなら、乱数を生成する必要はありません。この部分コメントにある通り、本当のランダム性はプロセス全体の 128 ビットのシードが担っています。アドレスは「同時に存在するもの同士で重ならない」ことさえ保証できれば十分で、しかもタダで手に入ります。
- **コピーオンライトとの両立**:この部分コメントにある通り、コピーオンライトで複製するときは、シードを変えずに使い回します。シードが変わると要素の位置が変わり、`Dictionary` の添字（`Index`）が無効になるなど、値としての振る舞いが壊れるからです。新しく作るとき・大きさを変えるときだけ新しいシードにします。

## まとめ

- 同じシードのハッシュテーブル同士でキーを移すと、O(n²) に落ちることがある。
- 「テーブルごとに違う」だけでよい値は、乱数ではなくアドレスで安く作れる。
- 値のセマンティクスを守るため、コピーのときはシードを変えない。
