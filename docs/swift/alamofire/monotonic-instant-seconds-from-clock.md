---
title: "時計の調整に左右されない、単調な時刻を秒で求める"
description: "時刻の差を測るために、CLOCK_MONOTONIC_RAW で秒の小数を求める Alamofire の Instant の初期化。壁時計の変更の影響を受けない。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2026 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Instant.swift
lines: [42, 46]
function: "Instant.init()"
difficulty: 2
tags: [日時, 低レイヤ]
format: 2
---
## ひとことで

処理にかかった時間を測るとき、普通の時計（壁時計）は、途中で時刻が戻ったり進んだりすることがあります。この初期化は、再起動以後ずっと一方向に進む時計を読み、秒の小数で表します。

## コード

::: code-group

```swift:line-numbers=42 [日本語訳]
    init() {
        var time = timespec()
        clock_gettime(CLOCK_MONOTONIC_RAW, &time)
        value = Double(time.tv_sec) + (Double(time.tv_nsec) / 1_000_000_000)
    } // 次の行の空行の検査を、整形ツールで無効にしています。
```

```swift:line-numbers=42 [原文]
    init() {
        var time = timespec()
        clock_gettime(CLOCK_MONOTONIC_RAW, &time)
        value = Double(time.tv_sec) + (Double(time.tv_nsec) / 1_000_000_000)
    } // swiftformat:disable:next blankLinesBetweenScopes
```

:::

## 前提知識

- **壁時計と単調時計**: 壁時計は日付と時刻を表し、利用者やネットワークの同期で値が変わることがあります。単調時計は、一定の向きにしか進まない時計です。
- **`timespec`**: 秒（`tv_sec`）とナノ秒（`tv_nsec`）の組で、時刻を表す C の構造体です。
- **`clock_gettime`**: 指定した種類の時計を読み、`timespec` に入れる関数です。`CLOCK_MONOTONIC_RAW` は、調整を受けない単調時計です。
- **`Double`**: 小数を表す型です。秒とナノ秒を合わせると、1 つの小数の秒になります。

## 何をしているか

### 1. 時計を読み、`timespec` に入れる

`clock_gettime` に単調時計の種類を渡し、現在の時刻を `time` に入れます。

```swift:line-numbers=43
        var time = timespec()
        clock_gettime(CLOCK_MONOTONIC_RAW, &time)
```
### 2. 秒とナノ秒を、1 つの小数にまとめる

秒の部分に、ナノ秒を 10 億で割った小数を足します。これで、`value` は秒の小数になります。

```swift:line-numbers=45
        value = Double(time.tv_sec) + (Double(time.tv_nsec) / 1_000_000_000)
```
### 3. 閉じる括弧

`#if` の中の初期化が、ここで終わります。次の行は、整形ツールの検査を一時的に無効にしています。

```swift:line-numbers=46
    } // 次の行の空行の検査を、整形ツールで無効にしています。
```
## ここがすごい

- **差を取っても壊れない**: 2 つの値の差を取るとき、時計が途中で戻ったり進んだりしても、差が不正になりません。
- **1 つの小数で扱いやすい**: 秒とナノ秒を 1 つの `Double` にまとめているので、差や比較が簡単です。
- **OS ごとに別の読み方**: Apple 系と Linux 系では `clock_gettime` を使い、ほかでは `Date` を使います。`#if` で分けて、同じ `Instant` として使えます。

## まとめ

- 時刻の差を測るには、一方向にしか進まない単調時計を使う。
- `timespec` の秒とナノ秒を、1 つの秒の小数にまとめる。
- OS ごとの読み方の違いは、`#if` で分けている。
