---
title: "書き込みの前に、探して・広げて・確かめる"
description: "Dictionary に書き込む直前の準備をまとめる mutatingFind。キーを探し、必要なら記憶領域を確保してから探し直し、結果の食い違いで Hashable の約束違反を検出する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/NativeDictionary.swift
lines: [539, 562]
function: "_NativeDictionary.mutatingFind(_:isUnique:)"
difficulty: 3
tags: [ハッシュ, データ構造, 防御的プログラミング, 標準ライブラリ]
format: 2
---
## ひとことで

`Dictionary` に値を書き込む前には、いくつかの準備が必要です。キーがどこにあるかを探すこと、自分だけが記憶領域を持っているかを確かめること（コピーオンライト）、そして足りなければ広げることです。`mutatingFind` は、これをまとめて行います。書き込み先の枠と、キーが見つかったかを返します。面白いのは、広げたあとに探し直した結果が最初と違ったら、キーの `Hashable` 実装がおかしいと判断して、わかりやすく止まることです。

## コード

::: code-group

```swift:line-numbers=539 [日本語訳]
  internal mutating func mutatingFind(
    _ key: Key,
    isUnique: Bool
  ) -> (bucket: Bucket, found: Bool) {
    let (bucket, found) = find(key)

    // 記憶領域の準備をします。
    // `key` がまだ辞書になければ、このアクセスで挿入されると見なします。
    // 推測が外れたら、記憶領域を無駄に広げるかもしれませんが、それで問題ありません。
    // そうでなければ、削除か、その場での変更だけです。
    // ここまでが、準備の理由です。
    let rehashed = ensureUnique(
      isUnique: isUnique,
      capacity: count + (found ? 0 : 1))
    guard rehashed else { return (bucket, found) }
    let (b, f) = find(key)
    if f != found {
      #if !$Embedded
      KEY_TYPE_OF_DICTIONARY_VIOLATES_HASHABLE_REQUIREMENTS(Key.self)
      #else
      fatalError("duplicate keys in a Dictionary")
      #endif
    }
    return (b, found)
```

```swift:line-numbers=539 [原文]
  internal mutating func mutatingFind(
    _ key: Key,
    isUnique: Bool
  ) -> (bucket: Bucket, found: Bool) {
    let (bucket, found) = find(key)

    // Prepare storage.
    // If `key` isn't in the dictionary yet, assume that this access will end
    // up inserting it. (If we guess wrong, we might needlessly expand
    // storage; that's fine.) Otherwise this can only be a removal or an
    // in-place mutation.
    let rehashed = ensureUnique(
      isUnique: isUnique,
      capacity: count + (found ? 0 : 1))
    guard rehashed else { return (bucket, found) }
    let (b, f) = find(key)
    if f != found {
      #if !$Embedded
      KEY_TYPE_OF_DICTIONARY_VIOLATES_HASHABLE_REQUIREMENTS(Key.self)
      #else
      fatalError("duplicate keys in a Dictionary")
      #endif
    }
    return (b, found)
```

:::

## 前提知識

- **`find(_:)`**: キーを探し、`(bucket: 枠, found: 見つかったか)` を返します。見つからなければ、挿入すべき空きの枠を返します。
- **`ensureUnique(isUnique:capacity:)`**: 記憶領域が他と共有されていれば複製し、容量が足りなければ広げます。中身を作り直したら true を返します。
- **コピーオンライト**: Swift の辞書は、コピーしても中身を共有しておき、書き込むときに初めて複製します。`isUnique` は、いま自分だけが持っているかを表します。
- **`Hashable` の約束**: 等しいキーは同じハッシュ値を返すこと、辞書に入れたキーを後から変えないことです。これが破られると、辞書は正しく動きません。
- **`Never` を返す関数**: 戻らない関数です。呼ぶとプログラムが停止します。

## 何をしているか

### 1. まず探す

キーがあるか、どの枠かを調べます。結果は、枠の位置と「見つかったか」の組です。

```swift:line-numbers=543
    let (bucket, found) = find(key)
```
### 2. 書き込みの準備をする

キーがなければ、このアクセスで挿入されるだろうと推測し、`count + 1` 個入る容量を確保します。キーがあれば、容量は今の `count` のままで十分です。推測が外れても、記憶領域が少し広がるだけで、正しさには影響しません。

```swift:line-numbers=545
    // 記憶領域の準備をします。
    // `key` がまだ辞書になければ、このアクセスで挿入されると見なします。
    // 推測が外れたら、記憶領域を無駄に広げるかもしれませんが、それで問題ありません。
    // そうでなければ、削除か、その場での変更だけです。
    // ここまでが、準備の理由です。
    let rehashed = ensureUnique(
      isUnique: isUnique,
      capacity: count + (found ? 0 : 1))
```
### 3. 作り直していなければ、そのまま返す

複製も拡張もしていなければ、枠の位置は変わりません。最初に探した結果を、そのまま返します。

```swift:line-numbers=553
    guard rehashed else { return (bucket, found) }
```
### 4. 作り直したら、探し直して確かめる

広げたり複製したりすると、テーブルの大きさやシードが変わり、要素の位置も変わります。だから探し直します。このとき「見つかったか」は最初と同じはずです。違ったら、キーの `==` と `hashValue` が食い違っているか、辞書に入れたキーが後から変更されたことを意味します。そのときは、専用の関数で停止します。組み込み向けの Swift では、代わりに `fatalError` で止まります。

```swift:line-numbers=554
    let (b, f) = find(key)
    if f != found {
      #if !$Embedded
      KEY_TYPE_OF_DICTIONARY_VIOLATES_HASHABLE_REQUIREMENTS(Key.self)
      #else
      fatalError("duplicate keys in a Dictionary")
      #endif
    }
    return (b, found)
```
## ここがすごい

- **推測で容量を確保する**: キーがなければ挿入されるだろうと推測して、先に広げます。外れたときは少し無駄に広がるだけです。当たれば、挿入のときに探し直しも広げ直しも要りません。
- **ついでにバグを見つける**: 探し直しは位置を知るために必要な処理ですが、結果を最初と比べるだけで、利用者の `Hashable` 実装のバグを検出できます。追加のコストはほぼゼロです。
- **クラッシュの名前が分かりやすい**: 停止に使う関数は、すべて大文字の長い名前になっています。クラッシュのレポートを見た開発者が、関数名だけで原因に気づけるようにするための工夫です。

## まとめ

- 書き込みの前に「探す・複製する・広げる」を 1 か所にまとめると、書き込み側が単純になる。
- 同じ問いを 2 回計算するときは、答えの食い違いを検査に使える。
- クラッシュの原因を伝える関数名やメッセージは、デバッグする人への手がかりになる。
