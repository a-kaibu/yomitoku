---
title: "文字の位置から、行番号と列と行の中身を求める"
description: "文字列の中の位置（String.Index）を、0 から始まる行番号、UTF-16 単位の列、その行の文字列に変換する関数。YAML の構文エラーを、行と列つきで伝えるために使われる。"
language: swift
project: "Yams"
repo: https://github.com/jpsim/Yams
license: MIT
copyright: "Copyright (c) 2016 JP Simard."
commit: "df801bc4f158f107035d2e14f6d0d8d31eb31ddb"
file: Sources/Yams/String+Yams.swift
lines: [32, 51]
function: "String.lineNumberColumnAndContents(at:)"
difficulty: 2
tags: [文字列処理, Unicode, パース]
format: 2
---
## ひとことで

`lineNumberColumnAndContents(at:)` は、文字列の中のある位置が、**何行目の何列目か** を求めます。YAML の文法エラーを「行と列つきで」伝えるときに使われます。
行番号は 0 から、列は UTF-16 の単位で数えて 0 から始まります。ほかに、その行の文字列も一緒に返します。

## コード

```swift:line-numbers=32
    func lineNumberColumnAndContents(at index: Index) -> LineNumberColumnAndContents {
        assert((startIndex..<endIndex).contains(index))
        var number = 0
        var outStartIndex = startIndex, outEndIndex = startIndex, outContentsEndIndex = startIndex
        getLineStart(&outStartIndex, end: &outEndIndex, contentsEnd: &outContentsEndIndex,
                     for: startIndex..<startIndex)
        while outEndIndex <= index && outEndIndex < endIndex {
            number += 1
            let range: Range = outEndIndex..<outEndIndex
            getLineStart(&outStartIndex, end: &outEndIndex, contentsEnd: &outContentsEndIndex,
                         for: range)
        }
        let utf16StartIndex = outStartIndex.samePosition(in: utf16)!
        let utf16Index = index.samePosition(in: utf16)!
        return (
            number,
            utf16.distance(from: utf16StartIndex, to: utf16Index),
            String(self[outStartIndex..<outEndIndex])
        )
    }
```

## 前提知識

- **`String.Index`**: 文字列の中の位置を表す型です。整数の添字ではなく、文字の境界を指します。
- **`getLineStart(_:end:contentsEnd:for:)`**: 指定した範囲を含む行の、先頭・末尾・改行を除いた末尾を求める、標準ライブラリの関数です。
- **UTF-16**: 文字を 2 バイトの単位で数える方式です。絵文字などは 2 単位になります。多くのエディタや言語サーバーは、列をこの単位で数えます。

## 何をしているか

### 1. 最初の行の範囲を取る

行を数える前に、文字列の先頭の行の範囲を `getLineStart` で求めます。ここでは行番号 `number` は 0 のままです。

```swift:line-numbers=34
        var number = 0
        var outStartIndex = startIndex, outEndIndex = startIndex, outContentsEndIndex = startIndex
        getLineStart(&outStartIndex, end: &outEndIndex, contentsEnd: &outContentsEndIndex,
                     for: startIndex..<startIndex)
```
### 2. 位置を含む行まで進み、行番号を数える

行の末尾が指定した位置を超えるまで、次の行へ進みます。進むたびに `number` を 1 増やします。文字列の末尾に着いたら止めます。

```swift:line-numbers=38
        while outEndIndex <= index && outEndIndex < endIndex {
            number += 1
            let range: Range = outEndIndex..<outEndIndex
            getLineStart(&outStartIndex, end: &outEndIndex, contentsEnd: &outContentsEndIndex,
                         for: range)
        }
```
### 3. 列と行の文字列を返す

行の先頭と指定位置を、UTF-16 の位置に変換して、その差を列とします。行の中身は、行の先頭から行末までの部分文字列です。

```swift:line-numbers=44
        let utf16StartIndex = outStartIndex.samePosition(in: utf16)!
        let utf16Index = index.samePosition(in: utf16)!
        return (
            number,
            utf16.distance(from: utf16StartIndex, to: utf16Index),
            String(self[outStartIndex..<outEndIndex])
        )
```
## ここがすごい

- **行の範囲を 1 回ずつ進める**: 行の先頭と末尾を、`getLineStart` で次々に求めます。行の開始位置をすべて配列に保存しないので、メモリが少なくて済みます。
- **列は UTF-16 単位で数える**: 文字列の中の位置は `String.Index` ですが、エラーの列は他のツールと合う単位で返す必要があります。`samePosition(in:)` で UTF-16 の位置に変換してから差を取ることで、絵文字を含む行でも列が合います。
- **行と列を 1 回の走査で求める**: 行番号と列と中身を、同じ行の範囲から求めます。ばらばらに探し直す必要がありません。

## まとめ

- 文字列の位置を、行番号と列と行の中身に変換できる。
- 列は、エディタなどと合わせるため UTF-16 単位で数える。
- 行の範囲を 1 回ずつ進めれば、余分な配列を作らずに行番号を求められる。
