---
title: "区切り文字で、読み取った部分の列を作る"
description: "バッファを区切り文字ごとに分け、部分ごとの Parser の配列にする Hummingbird の split(separator:)。見つからなければ残りをまとめて追加する。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/HummingbirdCore/Utils/HBParser.swift
lines: [330, 344]
function: "split(separator:)"
difficulty: 2
tags: [パース, 文字列処理]
format: 2
---
## ひとことで

`a,b,c` のような文字列を、区切り文字 `,` の位置で分けて、`a`、`b`、`c` の 3 つの部分にします。Hummingbird では、HTTP のヘッダーやクエリを分けるときに使われる、小さなパーサの処理です。

## コード

```swift:line-numbers=330
    package mutating func split(separator: Unicode.Scalar) -> [Parser] {
        var subParsers: [Parser] = []
        while !self.reachedEnd() {
            do {
                let section = try read(until: separator)
                subParsers.append(section)
                unsafeAdvance()
            } catch {
                if !self.reachedEnd() {
                    subParsers.append(self.readUntilTheEnd())
                }
            }
        }
        return subParsers
    }
```

## 前提知識

- **`Unicode.Scalar`**: 1 つの Unicode の文字を表す型です。`","` のような、1 文字の区切りを表すのに使います。
- **サブパーサ**: 元のバッファの一部を指す、新しい `Parser` です。コピーを作らずに、範囲だけを持ちます。
- **`throws` と `do`/`catch`**: 途中で失敗したら、エラーを投げて `catch` で受けとめる仕組みです。ここでは「区切りが見つからない」を失敗として扱います。

## 何をしているか

### 1. 区切りまで読む

`read(until:)` は、区切り文字の位置までを 1 つの部分として読みます。区切りが見つからなければ、読み進めた位置を元に戻して `overflow` のエラーを投げます。

```swift:line-numbers=154
    @discardableResult package mutating func read(until: Unicode.Scalar, throwOnOverflow: Bool = true) throws -> Parser {
        let startIndex = self.index
        while !self.reachedEnd() {
            if unsafeCurrent() == until {
                return self.subParser(startIndex..<self.index)
            }
            unsafeAdvance()
        }
        if throwOnOverflow {
            _setPosition(startIndex)
            throw Error.overflow
        }
        return self.subParser(startIndex..<self.index)
    }
```
### 2. 区切りが見つかったら、部分を追加して進む

読み取った部分を配列に入れ、区切り文字の 1 つ先へ進みます。

```swift:line-numbers=334
                let section = try read(until: separator)
                subParsers.append(section)
                unsafeAdvance()
```
### 3. 区切りが見つからなければ、残りをまとめて追加する

エラーになったときは、まだ読んでいない部分が残っていれば、末尾までをまとめて 1 つの部分にします。これで、最後の部分（区切りがない部分）も落としません。

```swift:line-numbers=337
            } catch {
                if !self.reachedEnd() {
                    subParsers.append(self.readUntilTheEnd())
                }
            }
```
## ここがすごい

- **元のバッファをコピーしない**: 部分ごとの `Parser` は範囲を持つだけです。大きな入力でも、分けるたびに配列をコピーしません。
- **エラーで分岐する**: 「見つからない」を例外として扱い、残りの処理を `catch` にまとめています。`if` を重ねるより、流れが単純になります。
- **最後の部分を取りこぼさない**: 区切りがない末尾も、必ず 1 つの部分として返します。

## まとめ

- 区切り文字を探して、その手前までを 1 つの部分にする。
- 見つからなければ、残りを末尾までの 1 つの部分にする。
- 元のデータを複製せず、範囲で部分を表す。
