---
title: "取り除いた「実際に入っていた部分」を返す"
description: "OptionSet の remove(_:) で、要素を取り除く実装。取り除けなければ nil を返し、取り除けたときは、要求された要素と実際に入っていた要素の共通部分を返す。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/OptionSet.swift
lines: [288, 296]
function: "OptionSet.remove(_:)"
difficulty: 2
tags: [ビット演算, API設計, 型システム]
format: 2
---
## ひとことで

`OptionSet` から要素を取り除くメソッドです。取り除いた要素を返し、もともと入っていなければ `nil` を返します。このメソッドで面白いのは、返す値が「引数そのもの」ではなく、「実際に入っていた部分」になることです。ドキュメントの例では、`[.secondDay]` から `.express`（`.nextDay` と `.secondDay` を合わせた要素）を取り除くと、返ってくるのは `.express` ではなく、実際に入っていた `.secondDay` です。

## コード

```swift:line-numbers=288
  public mutating func remove(_ member: Element) -> Element? {
    let intersectionElements = intersection(member)
    guard !intersectionElements.isEmpty else {
      return nil
    }
    
    self.subtract(member)
    return intersectionElements
  }
```

## 前提知識

- **`OptionSet`**: `rawValue` のビットを、オン・オフの選択肢として使う型です。
- **`intersection(_:)`**: 共通部分（ビットの AND）を返します。
- **`subtract(_:)`**: 差集合にします（自分を書き換えます）。ビットでは `self & ~member` にあたります。
- **`Element?`**: 戻り値はオプショナルで、取り除くものがなければ `nil` になります。
- **`guard ... else { return nil }`**: 条件を満たさないときに、早めに関数を抜けます。

## 何をしているか

### 1. 取り除く要素との共通部分を求める

`options` が `[.secondDay, .priority]`、取り除く要素が `.priority` なら、共通部分は `.priority` です。ここで求めた共通部分が、戻り値の候補になります。

```swift:line-numbers=289
    let intersectionElements = intersection(member)
```
### 2. 何も入っていなければ nil を返す

共通部分が空なら、取り除くものはありません。`nil` を返し、`options` は変えません。ドキュメントの例で、同じ `.priority` を 2 回目に取り除くと `nil` になるのがこの場合です。

```swift:line-numbers=290
    guard !intersectionElements.isEmpty else {
      return nil
    }
```
### 3. 取り除いて、共通部分を返す

`subtract` で、取り除く要素のビットを下ろします。そして、求めておいた共通部分を返します。`options` が `[.secondDay]` のとき `.express` を取り除くと、共通部分は `.secondDay` です。`options` は空になり、`.secondDay` が返ります。

```swift:line-numbers=294
    self.subtract(member)
    return intersectionElements
```
## ここがすごい

- **実際に起きたことを返す**: 戻り値を引数そのものにせず、共通部分にしたことで、複数のビットを持つ要素を渡したときに、本当に取り除かれたビットが分かります。`.express` を渡しても、戻り値が `.secondDay` になるのはそのためです。
- **`nil` で「何もしなかった」を表す**: 共通部分が空のときは `nil` を返すので、呼び出し側は `if let removed = options.remove(.x) { ... }` と書けます。何かが取り除かれたときだけ処理をする、という書き方が 1 行で表せます。
- **共通部分の判定を先にする**: 取り除けるかを先に確かめてから、`subtract` を呼びます。取り除けないときに、無駄な書き換えが起きません。
- **ドキュメントがそのままテストケース**: ドキュメントの例には、「1 回目は取り除ける」「2 回目は nil」「複数ビットの要素なら共通部分だけ返る」という 3 つの境界のケースがそろっています。API の振る舞いを例で示すお手本です。

## まとめ

- `OptionSet` の要素は複数のビットを含むことがあるので、取り除いた結果は共通部分で返す。
- 何も起きなかったことを `nil` で表すと、`if let` で書きやすい API になる。
- ドキュメントの例に境界ケースを入れると、仕様が誤解なく伝わる。
