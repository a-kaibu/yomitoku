---
title: "時間差から情報が漏れないよう、最後まで比べて一致を調べる"
description: "ハッシュやトークンを比べるとき、途中で打ち切らずに全要素を比べる Vapor の secureCompare。タイミング攻撃を防ぐための書き方。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Bytes+SecureCompare.swift
lines: [15, 33]
function: "secureCompare(to:)"
difficulty: 2
tags: [セキュリティ, 防御的プログラミング]
format: 2
---
## ひとことで

トークンやハッシュのような秘密の値を比べるとき、違う場所が見つかった時点で打ち切ると、かかった時間の差から中身の情報が漏れることがあります。この関数は、最後まですべての要素を比べてから結果を返します。

## コード

::: code-group

```swift:line-numbers=15 [日本語訳]
    public func secureCompare<C>(to other: C) -> Bool where C: Collection, C.Element == Element {
        let chk = self
        let sig = other

        // 1 要素ずつ比べて、タイミング攻撃を避けます。
        var match = true
        for i in 0..<Swift.min(chk.count, sig.count) {
            if chk[chk.index(chk.startIndex, offsetBy: i)] != sig[sig.index(sig.startIndex, offsetBy: i)] {
                match = false
            }
        }

        // 長さが同じなら、比べた結果を採用します。
        if chk.count == sig.count {
            return match
        } else {
            return false
        }
    }
```

```swift:line-numbers=15 [原文]
    public func secureCompare<C>(to other: C) -> Bool where C: Collection, C.Element == Element {
        let chk = self
        let sig = other

        // byte-by-byte comparison to avoid timing attacks
        var match = true
        for i in 0..<Swift.min(chk.count, sig.count) {
            if chk[chk.index(chk.startIndex, offsetBy: i)] != sig[sig.index(sig.startIndex, offsetBy: i)] {
                match = false
            }
        }

        // finally, if the counts match then we can accept the result
        if chk.count == sig.count {
            return match
        } else {
            return false
        }
    }
```

:::

## 前提知識

- **タイミング攻撃**: 処理にかかる時間の違いを測って、秘密の値を少しずつ推測する攻撃です。最初の文字が違うと早く終わり、合っていると長く続く、といった差が手がかりになります。
- **`Collection` と `Element: Equatable`**: 要素を `==` で比べられる、任意の並びに使える条件です。`Data` や `[UInt8]` などに使えます。
- **`Swift.min`**: 2 つの値の小さいほうを返す関数です。ここでは、短いほうの長さを使うために使っています。

## 何をしているか

### 1. 短いほうの長さまで、1 つずつ比べる

途中で `break` せずに、最後まで比べ続けます。違いがあれば `match` を `false` にしますが、ループはそのまま続きます。

```swift:line-numbers=16
        let chk = self
        let sig = other

        // 1 要素ずつ比べて、タイミング攻撃を避けます。
        var match = true
        for i in 0..<Swift.min(chk.count, sig.count) {
            if chk[chk.index(chk.startIndex, offsetBy: i)] != sig[sig.index(sig.startIndex, offsetBy: i)] {
                match = false
            }
        }
```
### 2. 長さが同じときだけ、結果を採用する

長さが違うなら、中身が一致するはずはないので `false` を返します。長さが同じなら、ループで決めた `match` を返します。

```swift:line-numbers=27
        // 長さが同じなら、比べた結果を採用します。
        if chk.count == sig.count {
            return match
        } else {
            return false
        }
```
## ここがすごい

- **早く抜けない**: 違う要素を見つけても、`break` で止めません。どこで違ったかによって時間が変わらないようにしています。
- **結果を 1 つにまとめる**: 途中の結果を `match` という 1 つの値に畳み込んでいます。最後に 1 回だけ判断します。
- **長さの扱いを分けている**: 比べる範囲は短いほうに合わせ、長さの違いは最後に判定しています。

## まとめ

- 秘密の値は、違う場所が見つかっても止めずに、最後まで比べる。
- 結果は 1 つの変数にまとめ、最後に 1 回だけ返す。
- 長さが違う場合は、中身を比べても一致しないので `false` を返す。
