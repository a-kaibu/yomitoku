---
title: "「一部だけ入っていた」も返す OptionSet の remove"
description: "OptionSet から要素を取り除く remove。共通部分が空でなければ取り除き、実際に取り除いた部分を返す。複数ビットの要素を渡すと、入っていた部分だけが返る。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/OptionSet.swift
lines: [256, 296]
function: "OptionSet.remove(_:)"
difficulty: 1
tags: [ビット演算, API設計, 標準ライブラリ]
---
## ひとことで

`OptionSet`（ビットフラグを集合のように扱う仕組み）から要素を取り除くメソッドです。取り除いた要素を返し、もともと入っていなければ `nil` を返します。
ドキュメントの例がおもしろいところで、`[.secondDay]` から `.express`（`.nextDay` と `.secondDay` を合わせた要素）を取り除くと、返ってくるのは `.express` ではなく、**実際に入っていた `.secondDay`** です。

## コード

```swift:line-numbers=256
  /// Removes the given element and all elements subsumed by it.
  ///
  /// In the following example, the `.priority` shipping option is removed from
  /// the `options` option set. Attempting to remove the same shipping option
  /// a second time results in `nil`, because `options` no longer contains
  /// `.priority` as a member.
  ///
  ///     var options: ShippingOptions = [.secondDay, .priority]
  ///     let priorityOption = options.remove(.priority)
  ///     print(priorityOption == .priority)
  ///     // Prints "true"
  ///
  ///     print(options.remove(.priority))
  ///     // Prints "nil"
  ///
  /// In the next example, the `.express` element is passed to `remove(_:)`.
  /// Although `.express` is not a member of `options`, `.express` subsumes
  /// the remaining `.secondDay` element of the option set. Therefore,
  /// `options` is emptied and the intersection between `.express` and
  /// `options` is returned.
  ///
  ///     let expressOption = options.remove(.express)
  ///     print(expressOption == .express)
  ///     // Prints "false"
  ///     print(expressOption == .secondDay)
  ///     // Prints "true"
  ///
  /// - Parameter member: The element of the set to remove.
  /// - Returns: The intersection of `[member]` and the set, if the
  ///   intersection was nonempty; otherwise, `nil`.
  @inlinable // generic-performance
  @discardableResult
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

- **`OptionSet`**: `rawValue` のビット 1 つ 1 つをオン・オフの選択肢として使う型です。`[.secondDay, .priority]` のように配列の書き方で作れます。
- **`intersection(_:)`**: 共通部分（ビットの AND）を返します。
- **`subtract(_:)`**: 差集合にします（自分を書き換える）。ビットでは `self & ~member` です。
- **`Element?`**: 戻り値はオプショナルで、取り除くものがなければ `nil`。
- **`guard ... else { return nil }`**: 条件を満たさないときに早めに抜けます。
- **`print(x == .priority)`**: ドキュメントの例です。`.priority` は型名を省略した書き方（`ShippingOptions.priority`）です。

## 何をしているか

### 1. 共通部分を求める（この部分）

`options = [.secondDay, .priority]`、`member = .priority` なら、共通部分は `.priority` です。

### 2. 何も入っていなければ nil（この部分）

共通部分が空なら、取り除くものはありません。`nil` を返し、`options` は変えません。2 回目の `options.remove(.priority)` がこれにあたります（この部分）。

### 3. 取り除いて、取り除いた部分を返す（この部分）

`subtract` で `member` のビットを下ろし、共通部分を返します。

`options = [.secondDay]` から `.express`（`nextDay + secondDay`）を取り除くと、共通部分は `.secondDay`。`options` は空になり、`.secondDay` が返ります（この部分例）。

## ここがすごい

- **「実際に起きたこと」を返す**: 戻り値を「引数そのもの」ではなく「共通部分」にしたことで、複数ビットの要素を渡したときに、本当に取り除かれたビットがわかります。`Set.remove` は「取り除いた要素」を返しますが、その意味をビットフラグの世界に正しく当てはめた形です。
- **`nil` で「何もしなかった」を表す**: 共通部分が空のとき `nil` を返すので、呼び出し側は `if let removed = options.remove(.x) { ... }` と書けます。何かが取り除かれたときだけ処理をする、が 1 行で書けます。
- **ドキュメントがそのままテストケース**: 例の中に「1 回目は取り除ける」「2 回目は nil」「複数ビットの要素なら共通部分」と、境界になる 3 つのケースがそろっています。API の振る舞いを例で示すお手本です。

## まとめ

- `OptionSet` の要素は複数のビットを含むことがあるので、取り除いた結果は共通部分で返す。
- 何も起きなかったことを `nil` で表すと、`if let` で書きやすい API になる。
- ドキュメントの例に境界ケースを入れると、仕様が誤解なく伝わる。
