---
title: "ハッシュ値の配列から、最初に一致するキーの値を探す"
description: "要素を平らな配列に並べ、キーのハッシュ値だけを別の配列で持つ FlatDictionary の添字アクセス。小さな集まりに向く。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/HummingbirdCore/Utils/FlatDictionary.swift
lines: [60, 83]
function: "FlatDictionary の subscript(_:)"
difficulty: 2
tags: [データ構造, ハッシュ]
format: 2
---
## ひとことで

Hummingbird の `FlatDictionary` は、キーと値の組を 1 本の配列に並べ、キーのハッシュ値だけを別の配列で持ちます。添字で値を読むときは、ハッシュ値の配列から一致する位置を探し、同じ位置の値を返します。

## コード

```swift:line-numbers=60
    public subscript(_ key: Key) -> Value? {
        get {
            let hashKey = Self.hashKey(key)
            if let index = hashKeys.firstIndex(of: hashKey) {
                return self.elements[index].value
            } else {
                return nil
            }
        }
        set {
            let hashKey = Self.hashKey(key)
            if let index = hashKeys.firstIndex(of: hashKey) {
                if let newValue {
                    self.elements[index].value = newValue
                } else {
                    self.elements.remove(at: index)
                    self.hashKeys.remove(at: index)
                }
            } else if let newValue {
                self.elements.append((key: key, value: newValue))
                self.hashKeys.append(hashKey)
            }
        }
    }
```

## 前提知識

- **ハッシュ値**: キーを、決まった整数へ変換した値です。同じキーからは、同じハッシュ値が得られます。
- **`Hashable`**: ハッシュ値を計算できることを表す条件です。`Key: Hashable` と書いて、キーに使える型を限っています。
- **`firstIndex(of:)`**: 配列の中で、最初に一致した要素の位置を返します。見つからなければ `nil` です。
- **`if let newValue`**: `newValue` がオプショナルの値を持つかを調べ、持つなら中身を取り出す書き方です。

## 何をしているか

### 1. 読み出すとき: ハッシュ値の位置から値を取る

キーのハッシュ値を求め、`hashKeys` の中で最初に一致する位置を探します。その位置の `elements` から値を取り出します。

```swift:line-numbers=61
        get {
            let hashKey = Self.hashKey(key)
            if let index = hashKeys.firstIndex(of: hashKey) {
                return self.elements[index].value
            } else {
                return nil
            }
        }
```
### 2. 書き込むとき: 3 通りに分かれる

値を書くときは、次の 3 つの場合に分かれます。

- キーがあり、新しい値があるとき: 値を置き換える。
- キーがあり、値が `nil` のとき: その位置の要素を両方の配列から消す。
- キーがないとき: 両方の配列の末尾に追加する。

```swift:line-numbers=69
        set {
            let hashKey = Self.hashKey(key)
            if let index = hashKeys.firstIndex(of: hashKey) {
                if let newValue {
                    self.elements[index].value = newValue
                } else {
                    self.elements.remove(at: index)
                    self.hashKeys.remove(at: index)
                }
            } else if let newValue {
                self.elements.append((key: key, value: newValue))
                self.hashKeys.append(hashKey)
            }
        }
```
## ここがすごい

- **小さな集まりで速い**: 木構造を作らず、配列を前から探すだけです。要素が少ないなら、木より軽く扱えます。
- **キーの重複を許す**: 同じキーが複数の位置にあっても、読み出しでは最初の値を返します。全部の値は `subscript(values:)` で取り出せます。
- **書き換えと削除を 1 つの添字で**: `nil` を代入すると削除になり、辞書と同じ書き方で扱えます。

## まとめ

- キーと値の組を 1 本の配列に並べ、ハッシュ値の配列を並行して持つ。
- 読むときは、ハッシュ値の位置を探して同じ添字で値を取る。
- 書くときは、置き換え、削除、追加の 3 通りに分ける。
