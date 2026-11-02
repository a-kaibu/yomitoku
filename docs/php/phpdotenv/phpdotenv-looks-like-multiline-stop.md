---
title: "エスケープされていない引用符の数で、値の終わりを見分ける"
description: "phpdotenv の looksLikeMultilineStop は、行の中にある引用符のうち、バックスラッシュでエスケープされていないものを数えます。その数で、複数行の値が閉じられたかを判定します。"
language: php
project: phpdotenv
repo: https://github.com/vlucas/phpdotenv
license: BSD-3-Clause
copyright: Copyright (c) 2014, Graham Campbell.
commit: "96149103e62ac67e915f6d2ef59b72dee2e011e0"
file: src/Parser/Lines.php
lines: [117, 122]
function: Lines::looksLikeMultilineStop
difficulty: 3
format: 2
tags: [正規表現, パース, エラー処理]
---

## ひとことで

`looksLikeMultilineStop` は、`.env` の行に **閉じの引用符** があるかを判定する関数です。`\"` のように、バックスラッシュで打ち消された引用符は数えません。複数行の値がここで終わるかどうかを決めます。

## コード

```php:line-numbers=117
    private static function looksLikeMultilineStop(string $line, bool $started)
    {
        return Regex::occurrences('/(?<!\\\\)"/', \str_replace('\\\\', '', $line))->map(static function (int $count) use ($started) {
            return $started ? $count > 1 : $count >= 1;
        })->success()->getOrElse(false);
    }
```

## 前提知識

- **エスケープ**: 特別な意味を打ち消す書き方です。`\"` は、引用符を文字として書くための形です。
- **否定の後読み `(?<!\\)`**: 「直前がバックスラッシュでない」という条件を表す正規表現の書き方です。
- **`str_replace`**: 文字列の一部を置き換える関数です。ここではバックスラッシュの対（`\\`）を消しています。
- **`Regex::occurrences`**: 一致した回数を数える、ライブラリの関数です。
- **`getOrElse`**: 結果が失敗だったときに、代わりの値を使う書き方です。

## 何をしているか

### 1. 二重のバックスラッシュを先に消す

```php:line-numbers=119
        return Regex::occurrences('/(?<!\\\\)"/', \str_replace('\\\\', '', $line))->map(static function (int $count) use ($started) {
```

`str_replace('\\\\', '', $line)` で、`\\` の並びを消します。`\\"` は、バックスラッシュ自身が打ち消されていて、引用符は有効になっている形です。先に消しておくと、次の判定が単純になります。

### 2. エスケープされていない引用符を数える

```php:line-numbers=119
        return Regex::occurrences('/(?<!\\\\)"/', \str_replace('\\\\', '', $line))->map(static function (int $count) use ($started) {
```

`/(?<!\\)"/` は、直前にバックスラッシュのない引用符にマッチします。`Regex::occurrences` で、その数を取り出します。

### 3. 始まった行かどうかで基準を変える

```php:line-numbers=120
            return $started ? $count > 1 : $count >= 1;
        })->success()->getOrElse(false);
```

もし始まりと同じ行なら、引用符が 2 つ（開きと閉じ）必要なので `$count > 1`。途中の行なら、1 つあれば閉じなので `$count >= 1` です。

具体例として `KEY="abc"` は、始まりの行で引用符が 2 つあるので閉じています。`KEY="abc` は 1 つだけなので、まだ続いています。

## ここがすごい

### 「打ち消された引用符」を数えない

設定の値に、`\"` と書かれた引用符が含まれることがあります。これを閉じの印と見なすと、値の途中で終わってしまいます。否定の後読みで、エスケープされたものだけを除くことで、正しい終わりを見つけています。

### 同じ判定を、状態に合わせて使い分ける

始まりの行と途中の行では、必要な引用符の数が違います。`$started` を受け取って基準を切り替えるので、1 つの関数で両方の場合に対応できます。

### 失敗を、安全な既定値に変える

```php:line-numbers=119
        return Regex::occurrences('/(?<!\\\\)"/', \str_replace('\\\\', '', $line))->map(static function (int $count) use ($started) {
            return $started ? $count > 1 : $count >= 1;
        })->success()->getOrElse(false);
```

数える処理が失敗しても、`getOrElse(false)` で「閉じていない」とみなします。例外で止まらず、後の処理（閉じ忘れのエラー報告）に任せるので、安全側に倒れる設計です。

## まとめ

- 打ち消された記号（エスケープ）は、数える前に取り除くか、除外する条件を書く。
- 同じ判定でも、始まりの行と途中の行で基準を変えると正確になる。
- 失敗したときの既定値を、安全な側に決めておくと、処理が止まらずに済む。
- 否定の後読みで、「直前が〜でない」を書けると、エスケープの判定が簡潔になる。
