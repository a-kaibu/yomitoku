---
title: "ファイルに書く日時を、小数の秒を切り上げた整数の秒にそろえる"
description: "ファイル属性の日時は整数の秒でしか書けないため、Date の小数部分を切り上げてから書く Kingfisher の fileAttributeDate。テストでの値のずれを防ぐ。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2019 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Utility/ExtensionHelpers.swift
lines: [111, 116]
function: "fileAttributeDate"
difficulty: 1
tags: [日時, 数値計算]
format: 2
---
## ひとことで

ファイルの更新日時などの属性には、整数の秒だけを書き込めます。`Date` が小数の秒を持っていると、書き込みのときに丸められます。この拡張は、あらかじめ切り上げておくことで、読み戻したときの値を予測しやすくします。

## コード

::: code-group

```swift:line-numbers=111 [日本語訳]
    // Date は内部で TimeInterval（小数の秒）を持ちますが、ファイルの属性には整数の秒しか書けません。
    // 四捨五入すると、テストの期待値とずれやすくなります。
    // そこで、属性に書くときは、いつも切り上げます。
    var fileAttributeDate: Date {
        return Date(timeIntervalSince1970: ceil(timeIntervalSince1970))
    }
```

```swift:line-numbers=111 [原文]
    // `Date` in memory is a wrap for `TimeInterval`. But in file attribute it can only accept `Int` number.
    // By default the system will `round` it. But it is not friendly for testing purpose.
    // So we always `ceil` the value when used for file attributes.
    var fileAttributeDate: Date {
        return Date(timeIntervalSince1970: ceil(timeIntervalSince1970))
    }
```

:::

## 前提知識

- **`TimeInterval`**: 秒を `Double` で表した値です。小数の秒を持てます。
- **`timeIntervalSince1970`**: 1970 年 1 月 1 日からの秒数です。ファイルの属性の多くが、この基準で表されます。
- **`ceil`**: 小数を、それ以上で最も小さい整数に切り上げる関数です。`1.2` は `2.0`、`3.0` は `3.0` になります。
- **`Date(timeIntervalSince1970:)`**: 1970 年からの秒数から、`Date` を作ります。

## 何をしているか

### 1. 1970 年からの秒数を、切り上げる

現在の `Date` の秒数を `ceil` で切り上げ、その秒数から新しい `Date` を作って返します。元の `Date` は変わりません。

```swift:line-numbers=114
    var fileAttributeDate: Date {
        return Date(timeIntervalSince1970: ceil(timeIntervalSince1970))
    }
```
## ここがすごい

- **丸めの方向を決めている**: 四捨五入ではなく切り上げにしているので、どの値も、書いた後に「未来へずれる」か、同じ値のままになります。
- **テストで予測できる**: 小数の秒が混ざると、テストの期待値とずれることがあります。切り上げておけば、整数の秒で比べられます。
- **呼ぶ場所を限定している**: 属性に書くときだけ使う名前にして、通常の `Date` の値は変えないようにしています。

## まとめ

- ファイル属性は、整数の秒でしか書けない。
- 小数の秒は `ceil` で切り上げてから `Date` を作る。
- 通常の `Date` は変えず、書き込み用の値だけを整える。
