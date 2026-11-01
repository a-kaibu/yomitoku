---
title: "Content-Type を、ワイルドカードつきの型と比べる"
description: "レスポンスの Content-Type を、text/* や */* などのワイルドカードを含む許容リストと比べる仕組み。パラメータ（; 以降）は無視し、型と部分型をそれぞれ比べる。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Features/Validation.swift
lines: [35, 64]
function: "MIMEType.init?(_:) and MIMEType.matches(_:)"
difficulty: 2
tags: [文字列処理, ネットワーク, パース]
format: 2
---
## ひとことで

HTTP のレスポンスには、`Content-Type: text/html; charset=utf-8` のように、データの種類が書かれています。`Alamofire` は、このレスポンスが許容される種類かを検査できます。
許容リストには、`image/*`（画像ならどれでも）や `*/*`（何でも）のような **ワイルドカード** を書けます。この `MIMEType` は、その文字列を解析し、ワイルドカードを考えて比べます。

## コード

```swift:line-numbers=35
    struct MIMEType {
        let type: String
        let subtype: String

        var isWildcard: Bool { type == "*" && subtype == "*" }

        init?(_ string: String) {
            let components: [String] = {
                let stripped = string.trimmingCharacters(in: .whitespacesAndNewlines)
                let split = stripped[..<(stripped.range(of: ";")?.lowerBound ?? stripped.endIndex)]

                return split.components(separatedBy: "/")
            }()

            if components.count == 2, let type = components.first, let subtype = components.last {
                self.type = type
                self.subtype = subtype
            } else {
                return nil
            }
        }

        func matches(_ mime: MIMEType) -> Bool {
            switch (type, subtype) {
            case (mime.type, mime.subtype), (mime.type, "*"), ("*", mime.subtype), ("*", "*"):
                true
            default:
                false
            }
        }
```

## 前提知識

- **MIME タイプ**: `種類/部分型` の形で、データの形式を表す文字列です。`text/html` や `image/png` などがあります。
- **ワイルドカード**: `*` で、何にでも一致することを表す記号です。`text/*` は、`text` の下のどの部分型にも一致します。
- **パラメータ**: `;` の後ろに書かれる補足情報です。`charset=utf-8` などがあり、種類の比較には使いません。
- **`components(separatedBy:)`**: 文字列を、指定した区切りで分けて配列にする関数です。

## 何をしているか

### 1. 文字列を、種類と部分型に分ける

前後の空白を取り、`;` より後ろ（パラメータ）を捨てます。残りを `/` で分けて、2 つの要素があれば、種類と部分型にします。2 つにならなければ、解析に失敗して `nil` を返します。

```swift:line-numbers=41
        init?(_ string: String) {
            let components: [String] = {
                let stripped = string.trimmingCharacters(in: .whitespacesAndNewlines)
                let split = stripped[..<(stripped.range(of: ";")?.lowerBound ?? stripped.endIndex)]

                return split.components(separatedBy: "/")
            }()

            if components.count == 2, let type = components.first, let subtype = components.last {
                self.type = type
                self.subtype = subtype
            } else {
                return nil
            }
```
### 2. 2 つの MIME タイプが、一致するかを見る

許容される側（`self`）と、レスポンス側（`mime`）を比べます。種類と部分型が両方一致する場合、どちらかがワイルドカードの場合、両方がワイルドカードの場合のいずれかなら、一致です。それ以外は一致しません。

```swift:line-numbers=57
        func matches(_ mime: MIMEType) -> Bool {
            switch (type, subtype) {
            case (mime.type, mime.subtype), (mime.type, "*"), ("*", mime.subtype), ("*", "*"):
                true
            default:
                false
            }
```
例として、許容リストが `image/*` で、レスポンスが `image/png; charset=binary` だとします。パラメータを捨てると `image/png` で、部分型のワイルドカードに一致します。一致と判定されます。

## ここがすごい

- **パラメータを無視して比べる**: `charset` などの補足は、種類の判断には要りません。`;` で切るだけで、比べる対象を絞れます。
- **ワイルドカードを 4 通りの組み合わせで書く**: `switch` のパターンに並べることで、ワイルドカードの位置による判定を 1 か所で読めます。
- **解析に失敗したら `nil`**: 不正な形式の値は、無理に比べず、失敗として扱えます。

## まとめ

- Content-Type の比較は、パラメータを捨て、種類と部分型に分けてから行う。
- 許容リストのワイルドカードは、種類か部分型のどちらか、または両方に使える。
- `switch` で 4 通りの組み合わせを並べると、判定の全体が読みやすい。
