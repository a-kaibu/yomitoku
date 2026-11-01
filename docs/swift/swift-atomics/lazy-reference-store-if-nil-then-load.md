---
title: "まだ空なら一度だけ入れ、入っている値を返す"
description: "swift-atomics の ManagedAtomicLazyReference.storeIfNilThenLoad(_:) が、compare-and-exchange で、空のときだけ新しい値を入れ、その後は既存の値を返す処理。"
language: swift
project: "Swift Atomics"
repo: https://github.com/apple/swift-atomics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 - 2023 Apple Inc. and the Swift project authors"
commit: "bc30c67cf0c4479633621ad7950d71494a07390f"
file: Sources/Atomics/Types/ManagedAtomicLazyReference.swift
lines: [79, 92]
function: "ManagedAtomicLazyReference.storeIfNilThenLoad(_:)"
difficulty: 3
tags: [並行処理, 低レイヤ]
format: 2
---
## ひとことで

重い値を、必要になったときに一度だけ作りたいことがあります。複数の処理が同時に作ろうとしても、最初に入った 1 つだけを使いたいものです。この関数は、値が空のときだけ新しい値を入れ、どの処理も最終的に同じ値を受け取れるようにします。

## コード

::: code-group

```swift:line-numbers=79 [日本語訳]
  public func storeIfNilThenLoad(_ desired: __owned Instance) -> Instance {
    let desiredUnmanaged = Unmanaged.passRetained(desired)
    let (exchanged, current) = _Rep.atomicCompareExchange(
      expected: nil,
      desired: desiredUnmanaged,
      at: _ptr,
      ordering: .acquiringAndReleasing)
    if !exchanged {
      // 参照はすでに初期化されています。
      // `desired` に対して行った retain を、ここで打ち消します。
      desiredUnmanaged.release()
      return current!.takeUnretainedValue()
    }
    return desiredUnmanaged.takeUnretainedValue()
```

```swift:line-numbers=79 [原文]
  public func storeIfNilThenLoad(_ desired: __owned Instance) -> Instance {
    let desiredUnmanaged = Unmanaged.passRetained(desired)
    let (exchanged, current) = _Rep.atomicCompareExchange(
      expected: nil,
      desired: desiredUnmanaged,
      at: _ptr,
      ordering: .acquiringAndReleasing)
    if !exchanged {
      // The reference has already been initialized. Balance the retain that
      // we performed on `desired`.
      desiredUnmanaged.release()
      return current!.takeUnretainedValue()
    }
    return desiredUnmanaged.takeUnretainedValue()
```

:::

## 前提知識

- **アトミック操作**: 途中で割り込まれず、1 回で終わる読み書きです。複数の処理から同時に使っても、値が壊れません。
- **compare-and-exchange**: 「今の値が期待どおりなら、新しい値に置き換える」を 1 回で行う操作です。戻り値で、置き換えが成功したかが分かります。
- **`Unmanaged`**: 参照の管理（retain と release の回数）を、手動で行うための型です。
- **retain と release**: オブジェクトを使っている人数を数える仕組みです。増やすのが retain、減らすのが release です。

## 何をしているか

### 1. 新しい値を、retain つきで用意する

渡された値を `Unmanaged.passRetained` で包みます。この時点で、参照の数が 1 増えます。

```swift:line-numbers=80
    let desiredUnmanaged = Unmanaged.passRetained(desired)
```
### 2. 空のときだけ、新しい値を入れる

compare-and-exchange で、今の値が `nil` のときだけ、用意した値に置き換えます。結果として、置き換えが成功したかどうかが `exchanged` に入ります。

```swift:line-numbers=81
    let (exchanged, current) = _Rep.atomicCompareExchange(
      expected: nil,
      desired: desiredUnmanaged,
      at: _ptr,
      ordering: .acquiringAndReleasing)
```
### 3. すでに入っていたら、用意した分を解放して既存の値を返す

置き換えに失敗したら、先に入っていた値が使われています。用意した値の retain を打ち消して、既存の値を返します。

```swift:line-numbers=86
    if !exchanged {
      // 参照はすでに初期化されています。
      // `desired` に対して行った retain を、ここで打ち消します。
      desiredUnmanaged.release()
      return current!.takeUnretainedValue()
```
### 4. 成功したら、入れた値を返す

置き換えに成功したときは、用意した値をそのまま返します。

```swift:line-numbers=92
    return desiredUnmanaged.takeUnretainedValue()
```
## ここがすごい

- **1 回だけ作られる**: 競合しても、最初に入った値が全員の答えになります。
- **余分な値を捨てる**: 負けた側は、自分の retain を打ち消すので、メモリが残りません。
- **ロックを使わない**: 1 つのアトミック操作で判断するので、待ちが発生しにくい作りです。

## まとめ

- 空かどうかを、アトミックに確かめて入れる。
- 負けた場合は、用意した値の retain を解放する。
- どちらの場合も、最終的に入っている値を返す。
