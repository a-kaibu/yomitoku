---
title: "URL の一区切りが、ルートの書き方に一致するか調べる"
description: "Web フレームワーク Hummingbird のルーターで、パスの 1 区切りが、固定の文字列、変数、接頭辞や接尾辞つきのワイルドカードのどれに一致するかを判定する演算子。switch の全部の場合を網羅して書かれている。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/Hummingbird/Router/RouterPath.swift
lines: [121, 142]
function: "RouterPath.Element.~=(_:_:)"
difficulty: 2
tags: [パース, 文字列処理, 設計パターン]
format: 2
---
## ひとことで

Web サーバーは、リクエストの URL のパスを `/files/photo.jpg` のように、`/` で区切られた部分ごとに照合します。Hummingbird では、ルートの各区切りを `RouterPath.Element` という値で表します。
この演算子 `~=` は、ルートの区切り（左）が、リクエストの区切り（右）に一致するかを判定します。`*.jpg` のような書き方や、`file.*` のような書き方も扱えます。

## コード

```swift:line-numbers=121
        public static func ~= (lhs: Element, rhs: some StringProtocol) -> Bool {
            switch lhs.value {
            case .path(let lhs):
                return lhs == rhs
            case .capture:
                return true
            case .prefixCapture(let suffix, _):
                return rhs.hasSuffix(suffix)
            case .suffixCapture(let prefix, _):
                return rhs.hasPrefix(prefix)
            case .wildcard:
                return true
            case .prefixWildcard(let suffix):
                return rhs.hasSuffix(suffix)
            case .suffixWildcard(let prefix):
                return rhs.hasPrefix(prefix)
            case .recursiveWildcard:
                return true
            case .null:
                return false
            }
        }
```

## 前提知識

- **`~=` 演算子**: パターンマッチで使われる演算子です。`case パターン:` の判定で、左の値を右の値と照合します。
- **`hasPrefix` と `hasSuffix`**: 文字列が、指定した文字列で始まるか、終わるかを判定する関数です。
- **`Substring`**: 文字列の一部を、コピーせずに指す型です。ルートの書き方の部分を、効率よく持つために使われています。
- **ワイルドカード**: 何が来ても一致させる書き方です。ここでは `*` のような記号で表します。

## 何をしているか

### 1. 固定の文字列は、完全に一致したときだけ

ルートの区切りが固定の文字列なら、リクエストの区切りとそのまま比べます。

```swift:line-numbers=123
            case .path(let lhs):
                return lhs == rhs
```
### 2. 変数（キャプチャ）は、何でも一致する

`capture` は、変数として値を取り込む区切りです。中身が何でも一致します。`prefixCapture` のように、接頭辞や接尾辞がついた変数は、その条件だけを確かめます。

```swift:line-numbers=125
            case .capture:
                return true
            case .prefixCapture(let suffix, _):
                return rhs.hasSuffix(suffix)
            case .suffixCapture(let prefix, _):
                return rhs.hasPrefix(prefix)
```
### 3. ワイルドカードと、一致しない場合

ワイルドカードは何でも一致します。接頭辞や接尾辞つきのワイルドカードは、その条件だけを確かめます。`null` は、どの区切りにも一致しません。

```swift:line-numbers=131
            case .wildcard:
                return true
            case .prefixWildcard(let suffix):
                return rhs.hasSuffix(suffix)
            case .suffixWildcard(let prefix):
                return rhs.hasPrefix(prefix)
            case .recursiveWildcard:
                return true
            case .null:
                return false
            }
```
## ここがすごい

- **`switch` が全部の場合を書いている**: `default` がないので、新しい種類を足すと、ここで書き忘れがコンパイルエラーになります。一致の判定の抜けが、実行時まで見つからない事態を防げます。
- **接頭辞・接尾辞の判定が 1 行**: `*.jpg` のような書き方は、`hasSuffix(".jpg")` の 1 回の判定になります。正規表現を使わずに済むので、速く、読みやすいです。
- **演算子で書けるので、ルーターの照合が自然**: 呼び出し側は `element ~= segment` と書くだけで、一致するかが分かります。

## まとめ

- ルートの区切りは、固定・変数・ワイルドカードの種類ごとに、一致の判定が決まっている。
- 接頭辞と接尾辞は `hasPrefix` と `hasSuffix` で判定すると、正規表現より簡単に書ける。
- `switch` に `default` を置かないと、新しい種類の書き忘れをコンパイラが見つけてくれる。
