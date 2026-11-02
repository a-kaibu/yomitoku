---
title: ".env の複数行の値を、1 つにつなげてから読む"
description: "phpdotenv の Lines::process は、.env ファイルの行を 1 つずつ見て、ダブルクォートで囲まれた複数行の値を 1 行にまとめます。コメントや空の行は取り除きます。"
language: php
project: phpdotenv
repo: https://github.com/vlucas/phpdotenv
license: BSD-3-Clause
copyright: Copyright (c) 2014, Graham Campbell.
commit: "96149103e62ac67e915f6d2ef59b72dee2e011e0"
file: src/Parser/Lines.php
lines: [32, 52]
function: Lines::process
difficulty: 2
format: 2
tags: [パース, 文字列処理, 入出力]
---

## ひとことで

`Lines::process` は、`.env` ファイルの **行の並び** を整える関数です。複数行にまたがる値（`KEY="..."`）を 1 つにつなぎ、コメントや空行は取り除きます。後の処理は、1 行 1 件の形で値を読めばよくなります。

## コード

::: code-group

```php:line-numbers=32 [日本語訳]
    public static function process(array $lines)
    {
        $output = [];
        $multiline = false;
        $multilineBuffer = [];

        foreach ($lines as $line) {
            [$multiline, $line, $multilineBuffer] = self::multilineProcess($multiline, $line, $multilineBuffer);

            if (!$multiline && !self::isCommentOrWhitespace($line)) {
                $output[] = $line;
            }
        }

        // 閉じられていない複数行の値も出力して、パーサーに閉じ忘れを報告させる。
        if ($multiline) {
            $output[] = \implode("\n", $multilineBuffer);
        }

        return $output;
    }
```

```php:line-numbers=32 [原文]
    public static function process(array $lines)
    {
        $output = [];
        $multiline = false;
        $multilineBuffer = [];

        foreach ($lines as $line) {
            [$multiline, $line, $multilineBuffer] = self::multilineProcess($multiline, $line, $multilineBuffer);

            if (!$multiline && !self::isCommentOrWhitespace($line)) {
                $output[] = $line;
            }
        }

        // Emit an unterminated multiline value so the parser reports the missing quote.
        if ($multiline) {
            $output[] = \implode("\n", $multilineBuffer);
        }

        return $output;
    }
```

:::

## 前提知識

- **`.env` ファイル**: 環境ごとの設定（データベースの接続先など）を `KEY=値` の形で書いたファイルです。
- **複数行の値**: 1 つの値が、改行をまたいで書かれたものです。ダブルクォートで囲むと書けます。
- **コメント**: 読み飛ばしてよい説明の行です。`#` で始まる行が該当します。
- **`implode`**: 配列の要素を、指定した文字でつなぐ PHP の関数です。
- **`foreach`**: 配列を先頭から順に回す書き方です。

## 何をしているか

### 1. 1 行ずつ、複数行の状態を確かめながら進める

```php:line-numbers=34
        $output = [];
        $multiline = false;
        $multilineBuffer = [];

        foreach ($lines as $line) {
            [$multiline, $line, $multilineBuffer] = self::multilineProcess($multiline, $line, $multilineBuffer);

            if (!$multiline && !self::isCommentOrWhitespace($line)) {
                $output[] = $line;
            }
        }
```

`$multiline` は、今が複数行の値の途中かを表す真偽値です。`multilineProcess` が、その行を受け取って、続きを読むべきか、1 つにまとめ終わったかを返します。

まだ複数行の途中なら、その行は出力に入れません。途中でないコメントや空行も、`isCommentOrWhitespace` で除きます。

### 2. 閉じられていない値は、そのまま出す

::: code-group

```php:line-numbers=46 [日本語訳]
        // 閉じられていない複数行の値も出力して、パーサーに閉じ忘れを報告させる。
        if ($multiline) {
            $output[] = \implode("\n", $multilineBuffer);
        }
```

```php:line-numbers=46 [原文]
        // Emit an unterminated multiline value so the parser reports the missing quote.
        if ($multiline) {
            $output[] = \implode("\n", $multilineBuffer);
        }
```

:::

ファイルの最後まで行っても、閉じのクォートが見つからなかった場合は、ためていた行を 1 つにして出力に入れます。ここで消してしまうと、書き忘れに気づけません。そのまま後の処理に渡して、エラーとして報告させます。

### 3. 残った行を返す

```php:line-numbers=51
        return $output;
```

すべての行を整えた配列を返します。

## ここがすごい

### 「行の並び」と「値の意味」を分ける

`.env` の解析は、大きく 2 段階に分かれています。まず、行の並びを整えるのがこの関数の仕事です。次に、`KEY=値` を読むのは別の処理です。段階ごとに役割を分けると、それぞれの処理が単純になります。

### 書き忘れを、隠さずに報告する

閉じのクォートがない値を黙って捨てると、利用者は理由がわかりません。コメントにあるとおり、中身をそのまま渡して、後の段階で「閉じのクォートがない」というエラーとして報告させています。失敗を見える形で残すのは、設定ファイルの扱いで特に大切です。

### 状態を変数に持つ、シンプルな読み方

`$multiline` と `$multilineBuffer` の 2 つの変数だけで、複数行の途中かを表しています。難しい仕組みは使わず、1 行ずつ前の状態を引き継いでいく、という素直な書き方です。

## まとめ

- 複数行にまたがる値は、行を 1 件ずつ見ながら途中の状態を持つと扱える。
- 段階を分けて、行の整理と値の解釈を別の処理にすると単純になる。
- 閉じ忘れは捨てずに後の段階へ渡すと、エラーとして報告できる。
- 状態は少ない変数で持つと、読み手が流れを追いやすい。
