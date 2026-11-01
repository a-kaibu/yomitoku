---
title: "浮動小数点の値を、許容誤差の範囲で等しいとみなす"
description: "テストで、浮動小数点の計算結果を、指定した許容誤差の範囲なら一致とみなすマッチャー。== で比べると誤差で失敗するため、差の絶対値を許容誤差と比べる。"
language: swift
project: "Nimble"
repo: https://github.com/Quick/Nimble
license: Apache-2.0
copyright: "Copyright 2016 Quick Team"
commit: "727f75d91a0f7501d08d938966d17e6728b76a2a"
file: Sources/Nimble/Matchers/BeCloseTo.swift
lines: [8, 19]
function: "isCloseTo(_:expectedValue:delta:)"
difficulty: 1
tags: [テスト, 数値計算, 防御的プログラミング]
format: 2
---
## ひとことで

コンピュータの小数は、2 進数で表すため、正確に表せない値があります。たとえば `0.1 + 0.2` は、`0.3` と完全には一致しません。
テストで、そのような計算結果を確かめたいときに使うのが `beCloseTo` です。値の差が、許容誤差 `delta` より小さければ、一致とみなします。この関数は、そのとき判定を行う内部の処理です。

## コード

```swift:line-numbers=8
internal func isCloseTo<Value: FloatingPoint>(
    _ actualValue: Value?,
    expectedValue: Value,
    delta: Value
) -> MatcherResult {
    let errorMessage = "be close to <\(stringify(expectedValue))> (within \(stringify(delta)))"
    return MatcherResult(
        bool: actualValue != nil &&
            abs(actualValue! - expectedValue) < delta,
        message: .expectedCustomValueTo(errorMessage, actual: "<\(stringify(actualValue))>")
    )
}
```

## 前提知識

- **浮動小数点数**: 小数を、2 進数の近似として持つ型です。`Double` や `Float` がこれにあたります。
- **許容誤差（delta）**: 「このくらいの差なら同じとみなす」という幅です。既定値は `0.0001` です。
- **`abs`**: 絶対値を返す関数です。差が正でも負でも、大きさだけを比べられます。
- **`Matcher`**: テストで、値が条件を満たすかを判定する仕組みです。Nimble の `expect(...).to(...)` で使います。

## 何をしているか

### 1. 公開のマッチャーは、期待値と許容誤差を受け取る

`beCloseTo` は、期待する値と許容誤差を受け取り、判定の処理を組み立てます。許容誤差を省略すると、既定の `0.0001` が使われます。

```swift:line-numbers=38
public func beCloseTo<Value: FloatingPoint>(
    _ expectedValue: Value,
    within delta: Value = defaultDelta()
) -> Matcher<Value> {
    return Matcher.define { actualExpression in
        return isCloseTo(try actualExpression.evaluate(), expectedValue: expectedValue, delta: delta)
    }
```
### 2. 差の絶対値が、許容誤差より小さいかを見る

実際の値が `nil` でなく、期待値との差の絶対値が `delta` より小さければ、一致です。`nil` のときは、値がないので失敗にします。

```swift:line-numbers=15
        bool: actualValue != nil &&
            abs(actualValue! - expectedValue) < delta,
```
### 3. 失敗したときは、期待と許容誤差を表示する

判定が失敗したときに、「期待値と、許容誤差の範囲」「実際の値」をメッセージにします。何が違ったかが、テストの出力で分かります。

```swift:line-numbers=17
        message: .expectedCustomValueTo(errorMessage, actual: "<\(stringify(actualValue))>")
    )
```
例として、`0.1 + 0.2` は `0.30000000000000004` になります。`0.3` との差は約 `5.5 × 10⁻¹⁷` で、`0.0001` より小さいので、一致とみなされます。`==` で比べると、失敗してしまう場合です。

## ここがすごい

- **`==` の代わりに差で比べる**: 浮動小数点の計算は、ほんの少し誤差が出ます。その誤差を、許容誤差として明示的に扱えます。
- **`nil` を先に確かめる**: 値がないときに、強制的に展開しないよう、先に `!= nil` を確かめています。失敗として扱えるので、テストが落ちるだけで済みます。
- **失敗の理由を表示する**: 期待値と許容誤差、実際の値を両方出すので、どれだけずれていたかがすぐ分かります。

## まとめ

- 浮動小数点は、正確に等しくならないことがあるので、許容誤差で比べる。
- 差の絶対値を許容誤差と比べると、符号を気にせず判定できる。
- 失敗時のメッセージに、期待と実際を並べると、テストの原因を追いやすい。
