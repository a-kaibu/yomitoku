---
title: "再帰で JSON の包みを外し、ふつの Any の配列と辞書に戻す"
description: "SwiftyJSON の内部値から、標準の Any 型の配列・辞書へ、入れ子をすべて戻す関数。switch の型パターンで、JSON・配列・辞書・それ以外を振り分ける。"
language: swift
project: "SwiftyJSON"
repo: https://github.com/SwiftyJSON/SwiftyJSON
license: MIT
copyright: "Copyright (c) 2014 - 2017 Ruoyu Fu, Pinglin Tang"
commit: "3d2544101a03f22b2217d464dc7d359eeb86e159"
file: Source/SwiftyJSON/SwiftyJSON.swift
lines: [260, 272]
function: "unwrap(_:)"
difficulty: 1
tags: [再帰, 型システム, イディオム]
format: 2
---
## ひとことで

SwiftyJSON は、内部で JSON の値を `JSON` 型や `Any` の配列・辞書として持っています。`unwrap(_:)` は、その入れ子をすべてたどって、`JSON` の包みを外し、標準的な `Any` の配列と辞書だけにする関数です。

## コード

::: code-group

```swift:line-numbers=260 [日本語訳]
/// 内部用: 入れ子になった値を、再帰的に包みを外して返す。
private func unwrap(_ object: Any) -> Any {
    switch object {
    case let json as JSON:
        return unwrap(json.object)
    case let array as [Any]:
        return array.map(unwrap)
    case let dictionary as [String: Any]:
        return dictionary.mapValues(unwrap)
    default:
        return object
    }
}
```

```swift:line-numbers=260 [原文]
/// Private method to unwarp an object recursively
private func unwrap(_ object: Any) -> Any {
    switch object {
    case let json as JSON:
        return unwrap(json.object)
    case let array as [Any]:
        return array.map(unwrap)
    case let dictionary as [String: Any]:
        return dictionary.mapValues(unwrap)
    default:
        return object
    }
}
```

:::

## 前提知識

- **`Any`**: どんな型の値でも入る型です。
- **`switch` の型パターン**: `case let json as JSON:` は、値が `JSON` 型なら、その値を `json` に取り出す書き方です。
- **`map` と関数の参照**: `array.map(unwrap)` は、配列の各要素に `unwrap` 関数を当てはめます。
- **`mapValues`**: 辞書の値だけを変換して、新しい辞書を作ります。鍵はそのままです。

## 何をしているか

### 1. JSON の包みを外す

`JSON` 型なら、中の `json.object` を取り出し、さらに `unwrap` します。包みが入れ子になっていても、外れるまで繰り返します。

```swift:line-numbers=263
    case let json as JSON:
        return unwrap(json.object)
```
### 2. 配列の中を変換する

`[Any]` なら、各要素に `unwrap` を当てた配列を返します。

```swift:line-numbers=265
    case let array as [Any]:
        return array.map(unwrap)
```
### 3. 辞書の中を変換する

`[String: Any]` なら、値だけを `unwrap` した辞書を返します。

```swift:line-numbers=267
    case let dictionary as [String: Any]:
        return dictionary.mapValues(unwrap)
```
### 4. それ以外はそのまま

数値や文字列など、どれにも当てはまらないものは、そのまま返します。

```swift:line-numbers=269
    default:
        return object
```
## ここがすごい

- **型で場合分けを 1 か所に**: 4 つの型のパターンを上から順に調べるだけで、入れ子の中身がどんな型でも対応できます。
- **再帰で深さを気にしない**: 配列や辞書の中に JSON や別の配列があっても、同じ関数が続きをたどります。深さを数える必要はありません。
- **`map(unwrap)` の簡潔さ**: 関数の名前をそのまま渡すことで、ループを書かずに変換を表せます。

## まとめ

- 入れ子の値は、型のパターンで場合分けして再帰的にたどる。
- 標準の型へ戻す変換は、`map` と再帰で短く書ける。
- 対応しない型は、そのまま返すと安全に扱える。
