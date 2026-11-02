---
title: 深夜0時からの経過秒を、1 行の差分で求める
description: Carbon の secondsSinceMidnight は、コピーした日時を 0 時に戻し、元の日時との差を秒数として返します。日付をまたいでも正しく動く、差分計算の使い方の例です。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/Traits/Difference.php
lines: [477, 480]
function: Difference::secondsSinceMidnight
difficulty: 1
format: 2
tags: [日時, API設計, 数値計算]
---
## ひとことで

`secondsSinceMidnight` は、その日の 0 時 0 分 0 秒から、今の日時までの経過秒数を小数で返すメソッドです。元の日時を書き換えず、コピーを 0 時に戻してから差を取ります。

## コード

```php:line-numbers=477
    public function secondsSinceMidnight(): float
    {
        return $this->diffInSeconds($this->copy()->startOfDay(), true);
    }
```

## 前提知識

- **日時オブジェクトの不変性**: Carbon には、元のオブジェクトを書き換えない「イミュータブル」な型もあります。メソッドを呼んでも、元の値は変わりません。
- **`copy()`**: 日時オブジェクトのコピーを作ります。コピーに対する変更は、元には影響しません。
- **`startOfDay()`**: その日の 0 時 0 分 0 秒に揃えたものを返します。
- **`diffInSeconds`**: 2 つの日時の差を秒数で返すメソッドです。第 2 引数の `true` は、差を正の値に揃える指定です。
- **`float`**: 小数の型です。秒の端数（マイクロ秒）まで含めて返せます。
- **メソッドチェーン**: `->` を続けて、前の結果に次のメソッドを呼ぶ書き方です。`copy()->startOfDay()` は、コピーを作ってから 0 時に戻します。

## 何をしているか

### 1. 0 時に戻したコピーを作る

```php:line-numbers=479
        return $this->diffInSeconds($this->copy()->startOfDay(), true);
```

`$this->copy()` で、今の日時のコピーを作ります。続けて `startOfDay()` を呼ぶと、そのコピーだけが当日の 0 時になります。元の `$this` は変わりません。

### 2. 差を秒数で求める

同じ行の `diffInSeconds(..., true)` は、今の日時と 0 時の差を秒数にします。第 2 引数の `true` は絶対値の指定で、差が負にならないようにします。0 時より前の時刻を比べるような場合でも、正の値が返ります。

たとえば 2024 年 3 月 1 日の 13 時 30 分に呼ぶと、結果は `48600.0`（13.5 時間分の秒数）になります。

## ここがすごい

- **元のオブジェクトを守る**: 0 時に戻す操作を直接すると、呼んだ日時が書き換わってしまいます。`copy()` を挟むことで、読むだけのメソッドとして安全に使えます。
- **差分の 1 つの式で完結**: 「その日の始まりからの経過」を、時刻の掛け算や分解なしで求めています。日付の計算はライブラリに任せ、呼ぶ側は意味だけを書けます。
- **夏時間などの扱いを任せる**: 0 時の定義や時間の差は、タイムゾーンの情報を持つ Carbon が計算します。自分で `時 * 3600 + 分 * 60` と書くと、夏時間の日に誤差が出ることがあります。
- **名前が仕様を語る**: `secondsSinceMidnight` という名前で、「深夜 0 時から」の基準が明確です。

## まとめ

- 日時のコピーを 0 時に戻し、元の日時との差を取ると、経過秒数が求まる。
- `copy()` で元の値を守ってから変更する、というのは不変な日時を扱う基本の形。
- 差の絶対値を取る指定により、符号を気にせず使える。
- 時刻の単純な計算より、ライブラリの差分メソッドを使うほうが夏時間に強い。
