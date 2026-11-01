---
title: "dict[key] の書き換えを 1 回の探索で済ませる _modify"
description: "Dictionary の添字による変更（dict[key] += 1 など）の内部実装。値をオプショナルとして一時的に貸し出し、戻ってきた結果を見て「更新・挿入・削除・何もしない」を決める。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/NativeDictionary.swift
lines: [412, 452]
function: "_NativeDictionary.subscript(key:isUnique:) _modify"
difficulty: 3
tags: [データ構造, ハッシュ, 最適化, 標準ライブラリ]
format: 2
---
## ひとことで

Swift では `counts["apple", default: 0] += 1` や `dict[key]?.append(x)`、`dict[key] = nil`（削除）のように、辞書の値を添字でその場で書き換えられます。素直に実装すると「探して読む、計算する、もう一度探して書く」と 2 回探索が必要です。この `_modify` は探索を 1 回だけにして、その場所の値を呼び出し側へ貸し出します。返ってきた値が `nil` かどうかで、更新・挿入・削除のどれをするかを決めます。

## コード

::: code-group

```swift:line-numbers=412 [日本語訳]
extension _NativeDictionary {
  @inlinable
  subscript(key: Key, isUnique isUnique: Bool) -> Value? {
    @inline(__always)
    get {
      // ダミーの定義です。使わないでください。
      return lookup(key)
    }
    @inline(__always)
    _modify {
      let (bucket, found) = mutatingFind(key, isUnique: isUnique)
      // 見つかったら、古い値を記憶領域から取り出し、
      // 貸し出す前に Optional で包みます。
      var value: Value? = unsafe (found ? (_values + bucket.offset).move() : nil)
      defer {
        // yield は例外を投げることがあるため、defer ブロックに入れています。
        // そのときも、辞書の不変条件を保つ必要があるからです。
        if let value = value {
          if found {
            // **変更。** 記憶領域を新しい値で初期化します。
            unsafe (_values + bucket.offset).initialize(to: value)
          } else {
            // **挿入。** 新しいエントリを、正しい位置に入れます。
            // `mutatingFind` が、容量の確保を済ませていることに注意してください。
            _insert(at: bucket, key: key, value: value)
          }
        } else {
          if found {
            // **削除。** 値はすでに破棄済みなので、
            // キーも破棄して、削除を登録します。
            unsafe (_keys + bucket.offset).deinitialize(count: 1)
            _delete(at: bucket)
          } else {
            // 何もしない。
          }
        }
      }
      yield &value
    }
  }
}
```

```swift:line-numbers=412 [原文]
extension _NativeDictionary {
  @inlinable
  subscript(key: Key, isUnique isUnique: Bool) -> Value? {
    @inline(__always)
    get {
      // Dummy definition; don't use.
      return lookup(key)
    }
    @inline(__always)
    _modify {
      let (bucket, found) = mutatingFind(key, isUnique: isUnique)
      // If found, move the old value out of storage, wrapping it into an
      // optional before yielding it.
      var value: Value? = unsafe (found ? (_values + bucket.offset).move() : nil)
      defer {
        // This is in a defer block because yield might throw, and we need to
        // preserve Dictionary invariants when that happens.
        if let value = value {
          if found {
            // **Mutation.** Initialize storage to new value.
            unsafe (_values + bucket.offset).initialize(to: value)
          } else {
            // **Insertion.** Insert the new entry at the correct place.  Note
            // that `mutatingFind` already ensured that we have enough capacity.
            _insert(at: bucket, key: key, value: value)
          }
        } else {
          if found {
            // **Removal.** We've already deinitialized the value; deinitialize
            // the key too and register the removal.
            unsafe (_keys + bucket.offset).deinitialize(count: 1)
            _delete(at: bucket)
          } else {
            // Noop
          }
        }
      }
      yield &value
    }
  }
}
```

:::

## 前提知識

- **`subscript`**: `dict[key]` のような添字の書き方を定義する構文です。`get` は読むとき、`_modify` は書くときに使われます。
- **`_modify` と `yield`**: 値を一時的に呼び出し側へ貸して、書き換えてもらってから続きを実行するためのアクセサです。`yield &value` の時点で呼び出し側の `+= 1` などが実行され、その後に `defer` の中身が動きます。`get` してから `set` するのと違い、値のコピーが起きません。
- **`move()`、`initialize(to:)`、`deinitialize(count:)`**: ポインタの先のメモリから値を取り出す、値を書き込む、値を破棄する操作です。
- **`defer { ... }`**: スコープを抜けるときに必ず実行されるブロックです。
- **`mutatingFind`**: キーを探し、必要なら記憶領域を複製・拡張してから、枠の位置と「見つかったか」を返します。

## 何をしているか

### 1. 探して、値を取り出す

`mutatingFind` で枠を探します。キーが見つかったら、その枠から値を `move()` で取り出し、`Optional` に包みます。見つからなければ `nil` です。取り出したので、枠の値の部分は空になります。

```swift:line-numbers=422
      let (bucket, found) = mutatingFind(key, isUnique: isUnique)
      // 見つかったら、古い値を記憶領域から取り出し、
      // 貸し出す前に Optional で包みます。
      var value: Value? = unsafe (found ? (_values + bucket.offset).move() : nil)
```
### 2. 呼び出し側に貸し出す

`yield &value` で、呼び出し側が `value` を書き換えます。たとえば `counts["apple", default: 0] += 1` なら、ここで 1 を足されます。

```swift:line-numbers=449
      yield &value
```
### 3. 結果に応じて 4 通りの処理をする

貸し出す前にキーがあったか、戻ってきた値が `nil` かで、次の 4 通りに分かれます。

- 前にあって、値がある: 枠に新しい値を書き込みます（更新）。
- 前になくて、値がある: 新しくエントリを挿入します。
- 前にあって、値が `nil`: キーも値も破棄して、削除を登録します。
- 前になくて、値が `nil`: 何もしません。

```swift:line-numbers=426
      defer {
        // yield は例外を投げることがあるため、defer ブロックに入れています。
        // そのときも、辞書の不変条件を保つ必要があるからです。
        if let value = value {
          if found {
            // **変更。** 記憶領域を新しい値で初期化します。
            unsafe (_values + bucket.offset).initialize(to: value)
          } else {
            // **挿入。** 新しいエントリを、正しい位置に入れます。
            // `mutatingFind` が、容量の確保を済ませていることに注意してください。
            _insert(at: bucket, key: key, value: value)
          }
        } else {
          if found {
            // **削除。** 値はすでに破棄済みなので、
            // キーも破棄して、削除を登録します。
            unsafe (_keys + bucket.offset).deinitialize(count: 1)
            _delete(at: bucket)
          } else {
            // 何もしない。
          }
        }
      }
```
## ここがすごい

- **1 回の探索で読み書き**: ハッシュの計算も枠の探索も 1 回だけです。値が配列のとき（`dict[k]?.append(x)`）は特に効果が大きく、`move()` で値を取り出しているので配列の参照は 1 つだけになり、コピーオンライトの複製が起きません。`get` と `set` で書くと、配列がまるごとコピーされてしまいます。
- **`defer` で不変条件を守る**: `yield` の途中でエラーが投げられることがあります。値を取り出して枠が空のまま抜けると、辞書が壊れてしまいます。`defer` に後始末を書くことで、どんな抜け方をしても辞書の状態が正しく戻ります。
- **挿入に備えて先に容量を確保**: `mutatingFind` は、キーがなければ「挿入されるかもしれない」と考えて、あらかじめ 1 つ分の容量を確保します。だから挿入のときは、探索のやり直しも拡張も要りません。

## まとめ

- `_modify` と `yield` を使うと、値をコピーせずに呼び出し側へ貸して書き換えてもらえる。
- 前の状態と後の状態の組み合わせで、更新・挿入・削除を 1 つのアクセサで扱える。
- 途中で抜ける可能性がある処理の後始末は `defer` に書く。
