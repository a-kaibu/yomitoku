---
title: "NSNumber の比較で、真偽値と数値を取り違えないようにする"
description: "Objective-C 由来の NSNumber には真偽値も数値も入るため、比べる前に真偽値かどうかを確かめる SwiftyJSON の == と < の定義。"
language: swift
project: "SwiftyJSON"
repo: https://github.com/SwiftyJSON/SwiftyJSON
license: MIT
copyright: "Copyright (c) 2014 - 2017 Ruoyu Fu, Pinglin Tang"
commit: "3d2544101a03f22b2217d464dc7d359eeb86e159"
file: Source/SwiftyJSON/SwiftyJSON.swift
lines: [1235, 1254]
function: "NSNumber の == と != と <"
difficulty: 2
tags: [型システム, 防御的プログラミング]
format: 2
---
## ひとことで

JSON の `true` と `1` は、見た目は違いますが、内部の `NSNumber` では、どちらも数値として表されることがあります。この比較は、真偽値と数値を混ぜて比べないように、先に種類を確かめています。

## コード

```swift:line-numbers=1235
func == (lhs: NSNumber, rhs: NSNumber) -> Bool {
    switch (lhs.isBool, rhs.isBool) {
    case (false, true): return false
    case (true, false): return false
    default:            return lhs.compare(rhs) == .orderedSame
    }
}

func != (lhs: NSNumber, rhs: NSNumber) -> Bool {
    return !(lhs == rhs)
}

func < (lhs: NSNumber, rhs: NSNumber) -> Bool {

    switch (lhs.isBool, rhs.isBool) {
    case (false, true): return false
    case (true, false): return false
    default:            return lhs.compare(rhs) == .orderedAscending
    }
}
```

## 前提知識

- **`NSNumber`**: Objective-C の時代から使われる、数値を包む型です。整数、小数、真偽値を、同じ型で持てます。
- **`isBool`**: その `NSNumber` が真偽値として作られたかを表す値です。`true` と `1` は、中身だけなら同じ数になるので、この印で区別します。
- **`compare(_:)`**: 2 つの `NSNumber` の大小を比べて、`orderedSame` などの結果を返すメソッドです。
- **`!=` の定義**: `==` の否定を返すだけで定義できる、という比較演算子の作り方です。

## 何をしているか

### 1. 真偽値と数値の組み合わせは、等しくない

一方だけが真偽値のときは、値が同じ数でも等しくないと判定します。

```swift:line-numbers=1236
    switch (lhs.isBool, rhs.isBool) {
    case (false, true): return false
    case (true, false): return false
```
### 2. 同じ種類どうしは、値を比べる

両方が真偽値か、両方が数値のときは、`compare` の結果が「同じ」なら等しいと判定します。

```swift:line-numbers=1239
    default:            return lhs.compare(rhs) == .orderedSame
```
### 3. `!=` は `==` の否定

`!=` は、`==` の結果を反対にするだけです。判定の方法を 1 か所にまとめています。

```swift:line-numbers=1243
func != (lhs: NSNumber, rhs: NSNumber) -> Bool {
    return !(lhs == rhs)
}
```
### 4. `<` も、同じ前提で大小を比べる

真偽値と数値の組み合わせは、大小も決めずに `false` を返します。同じ種類どうしだけ、`orderedAscending` で大小を判定します。

```swift:line-numbers=1250
    case (false, true): return false
    case (true, false): return false
    default:            return lhs.compare(rhs) == .orderedAscending
```
## ここがすごい

- **種類の違いを先に検査する**: 値の比べ方より前に、真偽値かどうかで分けています。`true` と `1` が誤って等しくなるのを防ぎます。
- **演算子を 1 か所で定義**: `!=` や `>=` を、既存の比べ方から組み立てているので、判定の仕組みが増えません。
- **同じ形の分岐を繰り返す**: どの演算子も、最初の `switch` で同じように種類を調べます。読む人が、規則をすぐ覚えられます。

## まとめ

- `NSNumber` は、真偽値も数値も同じ型に入るので、種類を別に確かめる。
- 種類が違う組み合わせは、等しくなく大小もないとする。
- 他の比較演算子は、`==` と `compare` から組み立てる。
