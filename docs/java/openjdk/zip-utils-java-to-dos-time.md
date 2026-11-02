---
title: "日時を、ZIP の 32 ビットの DOS 時刻へ詰め込む"
description: "Java 標準の ZipUtils.javaToDosTime。年・月・日・時・分・秒を、ZIP ファイルの DOS 形式の 32 ビットの各欄へシフトで詰め込み、符号の溢れをマスクで除く。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2013, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/zip/ZipUtils.java
lines: [139, 147]
function: "ZipUtils.javaToDosTime"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

ZIP ファイルは、各ファイルの更新日時を、DOS という古い形式の 32 ビットの値で記録します。`javaToDosTime` は、Java の `LocalDateTime` を、この 32 ビットの値に変換します。

年・月・日・時・分・秒を、それぞれ決まったビットの位置へ並べて、1 つの数にまとめています。

## コード

```java:line-numbers=139
    private static long javaToDosTime(LocalDateTime ldt) {
        int year = ldt.getYear() - 1980;
        return (year << 25 |
            ldt.getMonthValue() << 21 |
            ldt.getDayOfMonth() << 16 |
            ldt.getHour() << 11 |
            ldt.getMinute() << 5 |
            ldt.getSecond() >> 1) & 0xffffffffL;
    }
```

## 前提知識

- **ビットフィールド**: 1 つの整数を、いくつかの欄に分けて使う方法です。欄ごとに、何ビットを使い、どこから始まるかが決まっています。
- **DOS の時刻の形式**: 年は 1980 年からの差（7 ビット）、月は 4 ビット、日は 5 ビット、時は 5 ビット、分は 6 ビット、秒は 2 秒単位の値（5 ビット）です。
- **`<<`（左シフト）と `|`（OR）**: 欄の値を目的の位置へずらし、OR で 1 つにまとめます。
- **符号拡張**: `int` を `long` に広げると、最上位のビットが 1 なら上の桁も 1 で埋められます。

## 何をしているか

### 1. 各欄を、決まった位置へずらして OR する

```java:line-numbers=140
        int year = ldt.getYear() - 1980;
        return (year << 25 |
            ldt.getMonthValue() << 21 |
            ldt.getDayOfMonth() << 16 |
            ldt.getHour() << 11 |
            ldt.getMinute() << 5 |
            ldt.getSecond() >> 1) & 0xffffffffL;
```

- 年は `year << 25`（最上位の 7 ビット）
- 月は `<< 21`（4 ビット）
- 日は `<< 16`（5 ビット）
- 時は `<< 11`（5 ビット）
- 分は `<< 5`（6 ビット）
- 秒は `>> 1` して、下位の 5 ビット

という位置に並びます。秒を 2 で割るのは、DOS の形式が 2 秒単位だからです。

### 2. 上の桁を 32 ビットに収める

```java:line-numbers=146
            ldt.getSecond() >> 1) & 0xffffffffL;
```

`& 0xffffffffL` は、`long` の上の 32 ビット以外を 0 にします。年の欄は、`year` が 64 以上（2044 年以降）になると、`int` の符号ビットに入ってしまいます。その値を `long` に広げると、上の桁まで 1 で埋まるので、マスクで取り除いています。

## ここがすごい

- **欄の位置が式に出ている**: `<< 25`、`<< 21`、… と並んでいるので、どの欄がどのビットを使うかが、そのまま読み取れます。
- **符号の溢れを考えている**: 年の欄は 7 ビットで、`year << 25` は `int` の最上位に届きます。`& 0xffffffffL` を最後に付けることで、32 ビットの値として正しく取り出せます。
- **秒の精度を落とす**: 秒を 2 で割って、5 ビットに収めています。DOS の形式の制限に合わせた、1 行の処理です。
- **変換が 1 回の式で済む**: 欄ごとの変数を作らずに、式の 1 本で 32 ビットの値が出来上がります。

## まとめ

- `javaToDosTime` は、年・月・日・時・分・秒を、決まったビットの位置へシフトして OR でまとめる。
- 年の欄が `int` の符号ビットに届くため、最後の `& 0xffffffffL` で上の桁を取り除く。
- 秒は 2 秒単位なので、2 で割って 5 ビットに収める。
