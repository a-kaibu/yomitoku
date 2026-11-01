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
format: 2
---
## ひとことで

Swift の `Dictionary` や `Set` は、テーブルごとにハッシュのシード（ハッシュ値を計算するときに混ぜる値）を持っています。同じキーでも、テーブルが違えば入る位置が変わります。`hashSeed(for:scale:)` は、そのシードを決める関数です。テーブルの記憶領域のアドレスを、そのままシードにします。

## コード

::: code-group

```swift:line-numbers=108 [日本語訳]
  internal static func hashSeed(
    for object: Builtin.NativeObject,
    scale: Int8
  ) -> Int {
    // 新しいハッシュテーブルを確保するたびに、また既存のテーブルを大きくするたびに、
    // 新しいシードを生成します。特定のコピー操作が 2 乗の時間になるのを防ぐためです。
    // 背景の詳しい話は、次の URL にあります。
    // 参照先は、swift リポジトリの issue 45856 です。
    //
    // コピーオンライトの複製では、既存のシードを再利用することに注意してください。
    // そうしないと、値のセマンティクスが壊れてしまうからです。
    if Hasher._isDeterministic {
      // 決定的ハッシュを使うときは、
      // スケールの値をシードとして使うのも許されます。ほとんどの場合はこれで十分です。
      // （同じくらいの大きさの 2 つのテーブルを統合する操作は、それでも 2 乗になります。）
      return Int(scale)
    }
    // アドレスをハッシュのシードとして使います。これは
    // SystemRandomNumberGenerator より安く、実用上は同じ効果があります。
    // アドレスは完全にはランダムではありませんが、ここでの目的はそれではありません。
    // 本当のランダム性は、128 ビットの実行時シードが担います。
    // 必要なのは、同じシードのテーブル 2 つが同時に存在しないことだけです。
    // （同じテーブルのコピーオンライトによる派生を除きます。）
    return unsafe unsafeBitCast(object, to: Int.self)
  }
```

```swift:line-numbers=108 [原文]
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

:::

## 前提知識

- **ハッシュのシード**: ハッシュ関数に混ぜる追加の値です。同じキーでも、シードが違えばハッシュ値が変わります。
- **`Builtin.NativeObject`**: 標準ライブラリの内部で使う、参照カウントされるオブジェクトの型です。ここではハッシュテーブルの記憶領域を指します。
- **`unsafeBitCast(_:to:)`**: 値のビットをそのまま別の型として解釈します。ここでは、オブジェクトの参照を整数として取り出しています。
- **`Hasher._isDeterministic`**: テストなどのために、毎回同じハッシュ値を返すモードかどうかを表します。
- **コピーオンライト（copy-on-write）**: Swift の配列や辞書は、コピーしても中身を共有しておき、書き換えるときに初めて複製します。

## 何をしているか

### 1. 決定的モードの場合

テストでは毎回同じ結果が欲しいので、ランダムな値は使えません。そこで、テーブルの大きさを表す `scale` をシードにします。大きさが違えばシードも違うので、多くの場合はこれで十分です。

```swift:line-numbers=119
    if Hasher._isDeterministic {
      // 決定的ハッシュを使うときは、
      // スケールの値をシードとして使うのも許されます。ほとんどの場合はこれで十分です。
      // （同じくらいの大きさの 2 つのテーブルを統合する操作は、それでも 2 乗になります。）
      return Int(scale)
    }
```
### 2. ふだんの場合

テーブルの記憶領域のアドレスを `Int` として返します。アドレスは、同時に存在する 2 つのテーブルが同じになることはありません。だから、シードがかぶることもありません。乱数を生成するより安く済みます。

```swift:line-numbers=125
    // アドレスをハッシュのシードとして使います。これは
    // SystemRandomNumberGenerator より安く、実用上は同じ効果があります。
    // アドレスは完全にはランダムではありませんが、ここでの目的はそれではありません。
    // 本当のランダム性は、128 ビットの実行時シードが担います。
    // 必要なのは、同じシードのテーブル 2 つが同時に存在しないことだけです。
    // （同じテーブルのコピーオンライトによる派生を除きます。）
    return unsafe unsafeBitCast(object, to: Int.self)
```
## ここがすごい

- **「2 乗の罠」とは**: 辞書 A のキーを順番に取り出して、新しい辞書 B に入れていくとします。もし A と B が同じシードを使っていると、A の中で隣り合っていたキーは、B でも隣り合う位置に入ろうとします。その結果、オープンアドレス法の探索が長くなり、全体が 2 乗の時間になってしまいます。
- **乱数ではなくアドレスを使う**: 「テーブルごとに違う値」が欲しいだけなら、乱数を生成する必要はありません。本当のランダム性は、プロセス全体の 128 ビットのシードが担っています。アドレスは、同時に存在するもの同士で重ならないことさえ保証できれば十分です。
- **コピーオンライトとの両立**: コピーオンライトで複製するときは、シードを変えずに使い回します。シードが変わると要素の位置が変わり、`Dictionary` の添字（`Index`）が無効になるなど、値としての振る舞いが壊れるからです。新しく作るとき、または大きさを変えるときだけ、シードを決め直します。

## まとめ

- 同じシードのハッシュテーブル同士でキーを移すと、O(n²) に落ちることがある。
- テーブルごとに違うことだけが必要なら、乱数ではなくアドレスで安く作れる。
- 値のセマンティクスを守るため、コピーのときはシードを変えない。
