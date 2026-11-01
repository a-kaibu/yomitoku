---
title: "探索 → 拡張 → 再探索で「Hashable の約束違反」を見抜く"
description: "辞書を書き換える前の準備をする関数。キーを探し、必要なら記憶領域を複製・拡張してから探し直す。そのとき結果が食い違えば、キーの Hashable 実装が壊れていると判断して停止する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/NativeDictionary.swift
lines: [532, 563]
function: "_NativeDictionary.mutatingFind(_:isUnique:)"
difficulty: 3
tags: [ハッシュ, 防御的プログラミング, データ構造, 標準ライブラリ]
---
## ひとことで

`Dictionary` に値を書き込む前には、「キーがどこにあるか探す」「自分だけが記憶領域を持っているか確かめる（コピーオンライト）」「足りなければ広げる」という準備が必要です。
`mutatingFind` はこれをまとめて行い、書き込み先の枠と「キーが見つかったか」を返します。おもしろいのは、広げたあとに **探し直した結果が最初と違ったら、キーの型の `Hashable` 実装がおかしい** と判断して、わかりやすい名前の関数で停止させるところです。

## コード

```swift:line-numbers=532
  /// Same as find(_:), except assume a corresponding key/value pair will be
  /// inserted if it doesn't already exist, and mutated if it does exist. When
  /// this function returns, the storage is guaranteed to be native, uniquely
  /// held, and with enough capacity for a single insertion (if the key isn't
  /// already in the dictionary.)
  @safe
  @inlinable
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
  }
```

## 前提知識

- **`find(key)`**: キーを探し、`(bucket: 枠, found: 見つかったか)` を返します。見つからなければ、挿入すべき空き枠を返します。
- **`ensureUnique(isUnique:capacity:)`**: 記憶領域が他と共有されていれば複製し、容量が足りなければ広げます。中身を作り直した（再ハッシュした）ら true を返します。
- **コピーオンライト**: Swift の辞書はコピーしても中身を共有しておき、書き込むときに初めて複製します。`isUnique` は「いま自分だけが持っているか」です。
- **`Hashable` の約束**: 「等しい（`==`）キーは同じハッシュ値を返す」「辞書に入れたあとにキーを変えない」。これが破られると、辞書は正しく動きません。
- **`#if !$Embedded`**: 組み込み向けの Swift（Embedded Swift）かどうかで、コンパイル時に処理を切り替えます。
- **`Never` を返す関数**: 決して戻らない関数です。呼ぶとプログラムが停止します。

## 何をしているか

### 1. まず探す（この部分）

キーがあるか、どの枠かを調べます。

### 2. 書き込みの準備（この部分）

キーがなければ、挿入されるかもしれないので `count + 1` 個入る容量を求めます。あれば `count` のままです。

### 3. 作り直していなければそのまま返す（この部分）

複製も拡張もしていなければ、枠の位置は変わらないので、1 回目の結果をそのまま返します。

### 4. 作り直したら探し直す（この部分）

広げたり複製したりすると、テーブルの大きさやシードが変わり、要素の位置も変わります。なので探し直します。

このとき「見つかったか」は 1 回目と同じはずです。違ったら、キーの `==` と `hashValue` が食い違っている（等しいのにハッシュが違う）か、辞書に入れたキーが後から変更されたことを意味します。そこで `KEY_TYPE_OF_DICTIONARY_VIOLATES_HASHABLE_REQUIREMENTS` を呼んで停止します。

## ここがすごい

- **「推測」で容量を確保する**:この部分コメントにある通り、キーがなければ「挿入されるだろう」と推測して先に広げます。外れても（実は削除だった）少し無駄に広がるだけで、正しさには影響しません。当たれば、挿入時に二度手間になりません。
- **ついでにバグを見つける**: 再探索は位置を知るために必要な処理ですが、その結果を 1 回目と比べるだけで、ユーザーの `Hashable` 実装のバグを検出できます。追加のコストはほぼゼロです。
- **スタックトレースで目立つ名前**: 停止に使う関数は、すべて大文字の長い名前になっています（この部分コメント「スタックトレースで目立つように」）。クラッシュレポートを見た開発者が、関数名だけで原因に気づけます。エラーメッセージ（この部分）でも、「型が Hashable の要件を満たしていないか、入れたあとに変更した」と原因を具体的に教えてくれます。

## まとめ

- 書き込みの前に「探す・複製する・広げる」を 1 か所にまとめると、書き込み側が単純になる。
- 同じ問いを 2 回計算するときは、答えの食い違いを検査に使える。
- クラッシュの原因を伝える関数名やメッセージは、デバッグする人への贈り物。
