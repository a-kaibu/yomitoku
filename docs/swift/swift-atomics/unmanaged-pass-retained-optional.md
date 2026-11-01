---
title: "nil でなければ retain して包む、Optional 版の変換"
description: "swift-atomics の Unmanaged._passRetained(_:) が、Optional の値を受け取り、nil ならそのまま nil を返し、値があれば retain して Unmanaged に包む内部の関数。"
language: swift
project: "Swift Atomics"
repo: https://github.com/apple/swift-atomics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 - 2025 Apple Inc. and the Swift project authors"
commit: "bc30c67cf0c4479633621ad7950d71494a07390f"
file: Sources/Atomics/Unmanaged extensions.swift
lines: [44, 48]
function: "Unmanaged._passRetained(_:)"
difficulty: 2
tags: [メモリ管理, 低レイヤ]
format: 2
---
## ひとことで

参照を `Unmanaged` という、手動で数を管理する型に包みたいことがあります。値が nil の場合は、包む必要がありません。この関数は、nil をそのまま返し、値があるときだけ retain して包みます。

## コード

```swift:line-numbers=44
  @inline(__always)
  internal static func _passRetained(_ instance: __owned Instance?) -> Self? {
    guard let instance = instance else { return nil }
    return .passRetained(instance)
  }
```

## 前提知識

- **`Unmanaged`**: 参照の管理を、コンパイラから外して手動で行う型です。
- **`passRetained`**: 値を受け取って、retain（参照数の増加）をしてから `Unmanaged` に包みます。
- **`__owned`**: 引数の所有権を、関数の中へ渡す指定です。ここでは、受け取った値を包む役目を担います。
- **`@inline(__always)`**: 関数の本体を、呼び出し元にできるだけ直接埋め込むよう指示する属性です。

## 何をしているか

### 1. 値が nil なら、nil を返す

`guard let` で値を取り出します。nil なら、包む対象がないので、そのまま nil を返します。

```swift:line-numbers=46
    guard let instance = instance else { return nil }
```
### 2. 値があれば、retain して包む

値があるときは、`passRetained` で retain しながら `Unmanaged` に包みます。戻り値も Optional なので、型は合ったままです。

```swift:line-numbers=47
    return .passRetained(instance)
```
## ここがすごい

- **nil を特別扱いしない呼び出し側**: 呼ぶ側は、値の有無を気にせず、同じ関数を使えます。
- **参照の数を正しく増やす**: 包んだ後の解放を、対になる処理に任せられるように、retain を必ず行います。
- **小さな関数で分ける**: 変換の規則を 1 か所に集めて、ほかの処理で同じ書き方を繰り返さずに済みます。

## まとめ

- 値が nil なら、nil をそのまま返す。
- 値があれば、retain しながら `Unmanaged` に包む。
- 呼ぶ側は、nil かどうかを気にせず使える。
