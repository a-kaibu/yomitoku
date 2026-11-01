---
title: "HTTP の日付の形式で、時刻を固定の長さの文字列にする"
description: "HTTP ヘッダーで使う RFC 1123 の日付形式（Sun, 06 Nov 1994 08:49:37 GMT）を、曜日と月の名前と 0 埋めの数字で作る Vapor の format(_:)。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Date+RFC1123.swift
lines: [24, 54]
function: "format(_:)"
difficulty: 2
tags: [日時, 文字列処理]
format: 2
---
## ひとことで

HTTP の `Date` ヘッダーや `Last-Modified` には、「Sun, 06 Nov 1994 08:49:37 GMT」のような決まった形式の日付を書きます。この関数は、`Date` を、その形式の文字列に変換します。

## コード

::: code-group

```swift:line-numbers=24 [日本語訳]
    func format(_ value: Date) -> String {
        let c = Self.calendar.dateComponents(
            [.weekday, .day, .month, .year, .hour, .minute, .second],
            from: value
        )
        guard
            let weekday = c.weekday, let day = c.day, let month = c.month,
            let year = c.year, let hour = c.hour, let minute = c.minute,
            let second = c.second
        else {
            return ""
        }

        var out = ""
        out.reserveCapacity(29)  // 「Sun, 06 Nov 1994 08:49:37 GMT」は、いつも 29 文字です。
        out += Self.dayNames[weekday - 1]  // カレンダーの曜日は、1 が日曜、7 が土曜です。
        out += ", "
        out += Self.pad(day, 2)
        out += " "
        out += Self.monthNames[month - 1]  // カレンダーの月は、1 から 12 までの番号です。
        out += " "
        out += Self.pad(year, 4)
        out += " "
        out += Self.pad(hour, 2)
        out += ":"
        out += Self.pad(minute, 2)
        out += ":"
        out += Self.pad(second, 2)
        out += " GMT"
        return out
    }
```

```swift:line-numbers=24 [原文]
    func format(_ value: Date) -> String {
        let c = Self.calendar.dateComponents(
            [.weekday, .day, .month, .year, .hour, .minute, .second],
            from: value
        )
        guard
            let weekday = c.weekday, let day = c.day, let month = c.month,
            let year = c.year, let hour = c.hour, let minute = c.minute,
            let second = c.second
        else {
            return ""
        }

        var out = ""
        out.reserveCapacity(29)  // "Sun, 06 Nov 1994 08:49:37 GMT" is always 29 chars
        out += Self.dayNames[weekday - 1]  // Calendar weekday: 1 = Sunday ... 7 = Saturday
        out += ", "
        out += Self.pad(day, 2)
        out += " "
        out += Self.monthNames[month - 1]  // Calendar month: 1 ... 12
        out += " "
        out += Self.pad(year, 4)
        out += " "
        out += Self.pad(hour, 2)
        out += ":"
        out += Self.pad(minute, 2)
        out += ":"
        out += Self.pad(second, 2)
        out += " GMT"
        return out
    }
```

:::

## 前提知識

- **RFC 1123**: HTTP で日付を表すための形式です。曜日、日、月、年、時刻、`GMT` の順に、英語の略称を使って書きます。
- **`Calendar` と `dateComponents`**: `Date` を、年・月・日などの部品に分けて取り出す仕組みです。`Date` そのものは、時刻の値を持つだけです。
- **カレンダーの番号**: 曜日は 1 が日曜、7 が土曜です。月は 1 が 1 月、12 が 12 月です。配列の添字に変換するには、1 を引きます。
- **`pad(_:_:)`**: 数字を、指定した桁数まで 0 で埋める関数です。

## 何をしているか

### 1. 日付を部品に分け、必要な部品がそろっているかを確かめる

曜日、日、月、年、時、分、秒を取り出します。どれか 1 つでも欠けていれば、空の文字列を返します。

```swift:line-numbers=25
        let c = Self.calendar.dateComponents(
            [.weekday, .day, .month, .year, .hour, .minute, .second],
            from: value
        )
        guard
            let weekday = c.weekday, let day = c.day, let month = c.month,
            let year = c.year, let hour = c.hour, let minute = c.minute,
            let second = c.second
        else {
            return ""
        }
```
### 2. 曜日の名前を先頭に書く

カレンダーの曜日の番号を、配列の添字にして、英語の略称を取り出します。番号は 1 から始まるので、1 を引きます。

```swift:line-numbers=37
        var out = ""
        out.reserveCapacity(29)  // 「Sun, 06 Nov 1994 08:49:37 GMT」は、いつも 29 文字です。
        out += Self.dayNames[weekday - 1]  // カレンダーの曜日は、1 が日曜、7 が土曜です。
        out += ", "
```
### 3. 日、月、年、時刻を、決まった桁数で続ける

日は 2 桁、年は 4 桁、時・分・秒は 2 桁に 0 埋めします。月は、英語の略称を配列から取り出します。

```swift:line-numbers=41
        out += Self.pad(day, 2)
        out += " "
        out += Self.monthNames[month - 1]  // カレンダーの月は、1 から 12 までの番号です。
        out += " "
        out += Self.pad(year, 4)
        out += " "
        out += Self.pad(hour, 2)
        out += ":"
        out += Self.pad(minute, 2)
        out += ":"
        out += Self.pad(second, 2)
        out += " GMT"
```
## ここがすごい

- **結果の長さが決まっている**: 出力は常に 29 文字です。事前に容量を確保して、途中で再割り当てしないようにしています。
- **欠けた部品を許さない**: 1 つでも取り出せない部品があれば、空の文字列にします。不完全な日付を、誤って書き出しません。
- **タイムゾーンを GMT に固定**: 最後に `GMT` を付けるので、利用する環境の時差に影響されません。

## まとめ

- `Date` を曜日、日、月、年、時、分、秒の部品に分ける。
- 曜日と月は、英語の略称の表から取り出す。
- 数字は決まった桁数に 0 埋めして、最後に `GMT` を付ける。
