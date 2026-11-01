---
title: "途中で抜けずに比べて、結果の早さから中身を推測されないようにする"
description: "Vapor で、ハッシュなどの秘密の値を比べる secureCompare。全要素を比べ終えてから結果を返し、一致しない位置が分からないようにする。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Bytes+SecureCompare.swift
lines: [15, 33]
function: "Collection.secureCompare(to:)"
difficulty: 2
tags: [セキュリティ, 暗号, 防御的プログラミング]
format: 2
---
## ひとことで

`secureCompare(to:)` は、2 つのコレクションが同じかを比べます。普通の `==` と違い、途中で違いが見つかっても止まらず、最後まで比べます。
理由は、比べる時間の長さからの情報漏えいを防ぐためです。パスワードのハッシュのように、秘密の値を比べるときに使われます。

## コード

::: code-group

```swift:line-numbers=15 [日本語訳]
    public func secureCompare<C>(to other: C) -> Bool where C: Collection, C.Element == Element {
        let chk = self
        let sig = other

        // 1 要素ずつ比べる（タイミング攻撃を避けるため）。
        var match = true
        for i in 0..<Swift.min(chk.count, sig.count) {
            if chk[chk.index(chk.startIndex, offsetBy: i)] != sig[sig.index(sig.startIndex, offsetBy: i)] {
                match = false
            }
        }

        // 最後に、要素数が同じなら比べた結果を返す。
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

- **タイミング攻撃**: 処理にかかる時間を測って、秘密の値の中身を少しずつ推測する攻撃です。途中で止まるかどうかで、時間が変わってしまいます。
- **`Swift.min`**: 2 つの長さのうち小さいほうを返します。
- **`index(_:offsetBy:)`**: 添字を指定の数だけ進めます。
- **`where C.Element == Element`**: 要素の型が同じであることを条件にする書き方です。

## 何をしているか

### 1. 短いほうまで、1 バイトずつ比べる

`for` の中で、位置 `i` の要素を両方から取り出して比べます。違いがあっても、`match` を false にするだけで、ループは続きます。

```swift:line-numbers=19
        // 1 要素ずつ比べる（タイミング攻撃を避けるため）。
        var match = true
        for i in 0..<Swift.min(chk.count, sig.count) {
            if chk[chk.index(chk.startIndex, offsetBy: i)] != sig[sig.index(sig.startIndex, offsetBy: i)] {
                match = false
            }
```
### 2. 長さが同じかどうかで最終的な結果を決める

長さが違えば、中身が前の方で一致していても、必ず false です。長さが同じなら、ループでの結果を返します。

```swift:line-numbers=27
        // 最後に、要素数が同じなら比べた結果を返す。
        if chk.count == sig.count {
            return match
        } else {
            return false
        }
```
## ここがすごい

- **途中で抜けない**: 違いを見つけたら止まる普通の比較では、どこで違ったかが時間からわかってしまいます。最後まで比べるので、その情報が漏れにくくなります。
- **結果だけを返す**: 比べ方が同じなら、内容が違っても返す時間はほとんど変わりません。外からは「一致したか」だけが分かります。
- **注意点**: 添字の計算で `index(_:offsetBy:)` を使っているので、コレクションによっては時間が変わる可能性があります。定数時間の保証が必要な場面では、型に合った実装を選ぶ必要があります。

## まとめ

- 秘密の値の比較は、途中で抜けないようにすると、時間からの情報漏えいを減らせる。
- 長さの違いは先に判定して、最後の結果に反映する。
- 本当に定数時間が必要なら、この実装が十分かを型ごとに確かめる。
