---
title: "2 つの整数を 1 つの大きな整数に詰めて、戻す"
description: "左と右の整数を、ビットシフトと OR で 1 つの大きな整数へ詰め、マスクとシフトで取り出す NIO のビット詰め処理。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2021 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/IntegerBitPacking.swift
lines: [21, 59]
function: "packUU(_:_:type:) と unpackUU(_:leftType:rightType:)"
difficulty: 2
tags: [ビット演算, 低レイヤ, ジェネリクス]
format: 2
---
## ひとことで

2 つの小さな整数を、左右に並べて 1 つの大きな整数にまとめる処理です。左の値をビットシフトで上の位置へ動かし、右の値と OR で合わせます。取り出すときは、マスクと右シフトを使って元に戻します。

## コード

```swift:line-numbers=21
    @inlinable
    static func packUU<
        Left: FixedWidthInteger & UnsignedInteger,
        Right: FixedWidthInteger & UnsignedInteger,
        Result: FixedWidthInteger & UnsignedInteger
    >(
        _ left: Left,
        _ right: Right,
        type: Result.Type = Result.self
    ) -> Result {
        assert(MemoryLayout<Left>.size + MemoryLayout<Right>.size <= MemoryLayout<Result>.size)

        let resultLeft = Result(left)
        let resultRight = Result(right)
        let result = (resultLeft << Right.bitWidth) | resultRight
        assert(result.nonzeroBitCount == left.nonzeroBitCount + right.nonzeroBitCount)
        return result
    }

    @inlinable
    static func unpackUU<
        Input: FixedWidthInteger & UnsignedInteger,
        Left: FixedWidthInteger & UnsignedInteger,
        Right: FixedWidthInteger & UnsignedInteger
    >(
        _ input: Input,
        leftType: Left.Type = Left.self,
        rightType: Right.Type = Right.self
    ) -> (Left, Right) {
        assert(MemoryLayout<Left>.size + MemoryLayout<Right>.size <= MemoryLayout<Input>.size)

        let leftMask = Input(Left.max)
        let rightMask = Input(Right.max)
        let right = input & rightMask
        let left = (input >> Right.bitWidth) & leftMask

        assert(input.nonzeroBitCount == left.nonzeroBitCount + right.nonzeroBitCount)
        return (Left(left), Right(right))
    }
```

## 前提知識

- **ビットシフト**: `<<` は数値のビットを左へずらし、`>>` は右へずらします。1 ビット左へずらすと、値は 2 倍になります。
- **OR（`|`）**: 両方のビットのどちらかが 1 なら、1 になる演算です。上の位置へずらした値と、下の値を合わせるときに使います。
- **マスク**: 必要なビットだけを残すための数値です。`&` と組み合わせて使います。
- **ジェネリクス**: `Left: FixedWidthInteger & UnsignedInteger` のように、「固定幅の符号なし整数」という条件を付けて型を決めます。

## 何をしているか

### 1. 2 つの値を、大きい型に広げて詰める

たとえば、左が `0x12`、右が `0x34` のとき、結果は `0x1234` になります。左の値を `Right.bitWidth` だけ左へずらしてから、右の値と OR で合わせています。

```swift:line-numbers=33
        let resultLeft = Result(left)
        let resultRight = Result(right)
        let result = (resultLeft << Right.bitWidth) | resultRight
        assert(result.nonzeroBitCount == left.nonzeroBitCount + right.nonzeroBitCount)
        return result
```
### 2. 右の値を、マスクで取り出す

右の値は、下位のビットにあります。マスクで、その部分だけを残します。

```swift:line-numbers=52
        let leftMask = Input(Left.max)
        let rightMask = Input(Right.max)
        let right = input & rightMask
```
### 3. 左の値を、右へずらして取り出す

左の値は、右の幅の分だけ右へずらして、左の幅のマスクで切り出します。

```swift:line-numbers=55
        let left = (input >> Right.bitWidth) & leftMask

        assert(input.nonzeroBitCount == left.nonzeroBitCount + right.nonzeroBitCount)
        return (Left(left), Right(right))
```
## ここがすごい

- **型のビット幅を使っている**: ずらす量は `bitWidth` から決まるので、型が変わっても同じ式で書けます。
- **ビットの 1 の数で点検している**: `assert` で、詰めた前後の 1 の数が等しいことを確かめています。ビットが壊れていないかを、数で素早く確かめる方法です。
- **型の大きさを確かめている**: 詰める先の型が、2 つの型の合計より大きいことを `assert` で確かめています。

## まとめ

- 左をずらして右と OR で合わせると、2 つの値が 1 つにまとまる。
- 取り出すときは、右をマスクで、左を右シフトで切り出す。
- `assert` は最適化したビルドでは実行されないので、確認は開発時に役立つ。
