---
title: "足して回して XOR する、SipHash の 1 ラウンド"
description: "Swift の Dictionary や Set のハッシュ値を作る SipHash の心臓部。足し算・ビット回転・XOR だけで 4 つの 64 ビット値をかき混ぜる。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/SipHash.swift
lines: [48, 76]
function: "Hasher._State._round()"
difficulty: 3
tags: [ハッシュ, ビット演算, セキュリティ, 標準ライブラリ]
format: 2
---
## ひとことで

Swift の `Dictionary` や `Set` は、キーのハッシュ値を **SipHash**（シップハッシュ）というアルゴリズムで計算しています。
`_round()` はその 1 ラウンド分の処理で、内部状態である 4 つの 64 ビット整数 `v0`〜`v3` を、足し算（Add）・ビット回転（Rotate）・XOR の 3 種類だけで徹底的に混ぜ合わせます。この 3 つの頭文字から、こうした設計は ARX と呼ばれます。

## コード

```swift:line-numbers=48
extension Hasher._State {
  @inline(__always)
  private static func _rotateLeft(_ x: UInt64, by amount: UInt64) -> UInt64 {
    return (x &<< amount) | (x &>> (64 - amount))
  }

  @inline(__always)
  private mutating func _round() {
    v0 = v0 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 13)
    v1 ^= v0
    v0 = Hasher._State._rotateLeft(v0, by: 32)
    v2 = v2 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 16)
    v3 ^= v2
    v0 = v0 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 21)
    v3 ^= v0
    v2 = v2 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 17)
    v1 ^= v2
    v2 = Hasher._State._rotateLeft(v2, by: 32)
  }

  @inline(__always)
  private func _extract() -> UInt64 {
    return v0 ^ v1 ^ v2 ^ v3
  }
}
```

## 前提知識

- **`extension Hasher._State`**: 既存の型 `Hasher._State`（`Hasher` の中に入れ子で定義された型）に、後からメソッドを足しています。
- **`private static func`**: `static` は型そのものに属する関数（インスタンス不要）、`private` はこのファイルの中だけで使えるという意味です。
- **`&+`**: オーバーフローを許す足し算です。Swift の普通の `+` は結果が型の範囲を超えるとプログラムを止めますが、`&+` は 2^64 で割った余りとして黙って回り込みます。ハッシュ計算ではこの回り込みが欲しいのです。
- **`&<<` / `&>>`**: マスク付きのシフトです（チェックなしで CPU の命令になる）。
- **`^` と `^=`**: ビットごとの XOR（排他的論理和）です。同じビットなら 0、違えば 1。
- **ビット回転（rotate）**: シフトと違い、はみ出したビットを反対側から戻します。`10110000` を 2 ビット左回転すると `11000010` です。

## 何をしているか

### 回転

```swift:line-numbers=50
  private static func _rotateLeft(_ x: UInt64, by amount: UInt64) -> UInt64 {
    return (x &<< amount) | (x &>> (64 - amount))
  }
```
`_rotateLeft` は `(x << n) | (x >> (64 - n))` という定番の式です。左へずらした結果と、はみ出すはずだった上位ビットを右端へ持ってきた結果を OR で合体させます。多くの CPU はこの式を 1 個の回転命令（`rol` など）に変換します。

### 1 ラウンド

```swift:line-numbers=55
  private mutating func _round() {
    v0 = v0 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 13)
    v1 ^= v0
    v0 = Hasher._State._rotateLeft(v0, by: 32)
    v2 = v2 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 16)
    v3 ^= v2
    v0 = v0 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 21)
    v3 ^= v0
    v2 = v2 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 17)
    v1 ^= v2
    v2 = Hasher._State._rotateLeft(v2, by: 32)
  }
```
処理は 2 つの組 `(v0, v1)` と `(v2, v3)` が交差しながら進みます。

まず `v0` に `v1` を足し、`v1` を 13 ビット回して `v0` と XOR、`v0` を 32 ビット回します。同じことを `v2`, `v3` でも行います（回転量は 16）。

```swift:line-numbers=56
    v0 = v0 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 13)
    v1 ^= v0
    v0 = Hasher._State._rotateLeft(v0, by: 32)
    v2 = v2 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 16)
    v3 ^= v2
```
次は組み合わせを入れ替えて、`v0` と `v3`（21 ビット）、`v2` と `v1`（17 ビット）を混ぜます。

```swift:line-numbers=63
    v0 = v0 &+ v3
    v3 = Hasher._State._rotateLeft(v3, by: 21)
    v3 ^= v0
    v2 = v2 &+ v1
    v1 = Hasher._State._rotateLeft(v1, by: 17)
    v1 ^= v2
    v2 = Hasher._State._rotateLeft(v2, by: 32)
```
足し算は下位ビットの影響を上位へ伝え（繰り上がり）、回転はビットの位置を入れ替え、XOR は 2 つの値を混ぜます。これを繰り返すと、入力の 1 ビットの違いが状態全体に広がります。

### 取り出し

```swift:line-numbers=73
  private func _extract() -> UInt64 {
    return v0 ^ v1 ^ v2 ^ v3
  }
```
最後に 4 つを XOR して 1 つの 64 ビット値にし、ハッシュ値とします。

## ここがすごい

- **HashDoS 攻撃への備え**: 単純なハッシュ関数だと、攻撃者が「同じハッシュ値になるキー」を大量に作れます。そうしたキーを Web サーバーに送り付けると辞書の検索が極端に遅くなり、サービスが止まります（HashDoS）。SipHash は秘密の鍵（Swift ではプロセス起動ごとのランダムなシード）を混ぜるので、外部からは衝突を狙えません。
- **速くて小さい**: 暗号学的ハッシュ（SHA-256 など）ほど重くはなく、使う演算は CPU が 1 クロックでこなすものばかりです。足し算・回転・XOR だけなので、条件分岐もテーブル参照もありません。どんな入力でも同じ時間で終わります。
- **`&+` で意図を明示**: 普通の `+` だと桁あふれでクラッシュするのが Swift の安全設計です。ここでは回り込みこそが必要なので、`&+` で「わざとやっています」と書き分けています。

## まとめ

- ARX（足し算・回転・XOR）は、高速なハッシュや暗号でよく使われる混ぜ方。
- Swift の `+` はオーバーフローで止まる。回り込みが欲しいときは `&+` を使う。
- ハッシュテーブルを攻撃から守るには、秘密のシードを混ぜるハッシュ関数を使う。
