---
title: "デバッグビルドだけ動くコードを、assert で囲む"
description: "swift-log の debugOnly(_:) が、assert の中でクロージャを実行する仕組み。デバッグビルドでだけ本体が動き、リリースビルドでは取り除かれる。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2026 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/Locks.swift
lines: [165, 173]
function: "debugOnly(_:)"
difficulty: 2
tags: [ハック, 防御的プログラミング]
format: 2
---
## ひとことで

確認用の処理を、開発中だけ動かしたいことがあります。リリースのビルドでは、その処理を完全に消したいものです。この関数は、`assert` の中でクロージャを呼び出すことで、この要望を満たします。

## コード

```swift:line-numbers=165
@inlinable
internal func debugOnly(_ body: () -> Void) {
    assert(
        {
            body()
            return true
        }()
    )
}
```

## 前提知識

- **`assert`**: 条件が `false` のときに止める検査です。リリースビルドでは、中身の評価ごと取り除かれます。
- **クロージャの即時実行**: `{ ... }()` のように、クロージャを作ってすぐに呼び出す書き方です。
- **`return true`**: `assert` に渡す条件を、必ず `true` にするための値です。失敗はしません。
- **デバッグビルドとリリースビルド**: 開発中に使う、検査の多いビルドと、利用者へ配る最適化されたビルドのことです。

## 何をしているか

### 1. クロージャを assert の中で呼ぶ

`assert` に渡した式の中で、`body()` を実行します。この式はデバッグビルドでだけ評価されます。

```swift:line-numbers=167
    assert(
        {
            body()
            return true
        }()
```
### 2. 条件は常に true にする

クロージャの最後で `return true` を返すので、`assert` は失敗せず、本体の処理だけが残ります。

```swift:line-numbers=169
            body()
            return true
        }()
    )
```
## ここがすごい

- **リリースでは何も残らない**: `assert` の中身はリリースビルドで評価されないので、性能への影響がありません。
- **警告が出ない**: 「使われていない式」という警告を避けるための、Swift での定番の書き方です。
- **呼ぶ側はふつうに書ける**: 中身を `body` に渡すだけなので、使う側に特別な書き方は要りません。

## まとめ

- 確認用の処理を、クロージャとして受け取る。
- `assert` の中で実行し、デバッグビルドでだけ動かす。
- 条件を常に `true` にして、警告や失敗を避ける。
