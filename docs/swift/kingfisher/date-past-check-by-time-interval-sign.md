---
title: "日時が過去かどうかを、時間差の符号だけで判定する"
description: "Date の isPast(referenceDate:) は、基準の日時との差が 0 以下なら過去とみなす。短い式で、キャッシュの期限切れの判定などに使える。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2019 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Utility/ExtensionHelpers.swift
lines: [102, 109]
function: "isPast(referenceDate:)"
difficulty: 1
tags: [日時, 防御的プログラミング]
format: 2
---
## ひとことで

キャッシュの期限や、ダウンロードの有効期限を判定するには、「今より前かどうか」を調べる必要があります。この拡張は、`Date` どうしの時間差を求め、その符号で過去かどうかを判断します。

## コード

```swift:line-numbers=102
extension Date {
    var isPast: Bool {
        return isPast(referenceDate: Date())
    }

    func isPast(referenceDate: Date) -> Bool {
        return timeIntervalSince(referenceDate) <= 0
    }
```

## 前提知識

- **`Date`**: 日付と時刻を 1 つの値として表す型です。内部では、基準の日時からの秒数（`TimeInterval`）を持っています。
- **`timeIntervalSince(_:)`**: ある日時から、別の日時までの秒数を返します。差が負なら、基準より前であることを表します。
- **プロパティとメソッドの同名**: `isPast` という値のプロパティと、`isPast(referenceDate:)` というメソッドは、引数の有無で区別されます。
- **`Date()`**: 今の日時を表す `Date` を作ります。

## 何をしているか

### 1. 今の日時を基準にする

引数を持たない `isPast` は、今の日時を基準として、`isPast(referenceDate:)` を呼びます。

```swift:line-numbers=103
    var isPast: Bool {
        return isPast(referenceDate: Date())
    }
```
### 2. 時間差が 0 以下なら、過去とみなす

`timeIntervalSince` で、自分と基準の差を求めます。差が 0 以下なら、自分は基準と同じか、それより前です。

```swift:line-numbers=107
    func isPast(referenceDate: Date) -> Bool {
        return timeIntervalSince(referenceDate) <= 0
    }
```
## ここがすごい

- **比較を 1 つの式に**: 「より前」か「同じ」かを、`<= 0` の 1 回の比較で判定しています。
- **基準を差し替えられる**: 基準の日時を引数で渡せるので、テストでは固定の日時を使い、本番では今の日時を使えます。
- **名前で意図が伝わる**: `isPast` と書くだけで、期限切れかどうかを読み取れます。

## まとめ

- 時間差の符号で、過去か未来かを判定する。
- 基準の日時を引数にすると、テストで時刻を固定できる。
- 引数なしの版は、今の時刻を基準にする。
