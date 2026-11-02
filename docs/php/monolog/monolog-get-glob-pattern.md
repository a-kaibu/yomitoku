---
title: 日付つきのログファイルを探すための検索パターンを作る
description: Monolog の RotatingFileHandler の getGlobPattern は、ファイル名の日付の部分を、数字の範囲を表す検索パターンに変えます。古いログを探したり消したりするとき、今日以外の日付のファイルも一度に見つけられます。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/RotatingFileHandler.php
lines: [326, 343]
function: getGlobPattern
difficulty: 3
format: 2
tags: [ファイル, 正規表現, 日時]
---
## ひとことで

`getGlobPattern` は、日付つきのログファイルをまとめて探すための、検索パターンを作る関数です。`app-{date}.log` という設定から、`app-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].log` のような形のパターンを作ります。どの日のファイルも、このパターンで一度に見つけられます。

## コード

```php:line-numbers=326
    protected function getGlobPattern(): string
    {
        $fileInfo = pathinfo($this->filename);
        $glob = str_replace(
            ['{filename}', '{date}'],
            [$fileInfo['filename'], str_replace(
                ['Y', 'y', 'm', 'd', 'H'],
                ['[0-9][0-9][0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]'],
                $this->dateFormat
            )],
            self::appendDirectorySeparator($fileInfo['dirname'] ?? '') . $this->filenameFormat
        );
        if (isset($fileInfo['extension'])) {
            $glob .= '.'.$fileInfo['extension'];
        }

        return $glob;
    }
```

## 前提知識

- **glob パターン**: `*` や `[0-9]` などの印で、ファイル名の形を表す検索の書き方です。`*.log` のように、一致するファイルを一覧にできます。
- **`getTimedFilename` との関係**: 前に見た関数は、今日の日付で実際のファイル名を作ります。こちらは、日付の部分を何でも当たる形に変えて、過去のファイルを探すためのものです。
- **日付の書式（`Y`、`m`、`d` など）**: `Y` は 4 桁の年、`m` は 2 桁の月、`d` は 2 桁の日を表す記号です。
- **ネストした `str_replace`**: 内側の `str_replace` が日付の書式を正規表現に変え、その結果を外側の `str_replace` が使います。
- **`[0-9]`**: 0 から 9 までの一文字に当たる、文字の範囲の書き方です。

## 何をしているか

### 1. 元のファイル名を分ける

```php:line-numbers=328
        $fileInfo = pathinfo($this->filename);
```

`pathinfo` で、設定されたパスからファイル名と拡張子を取り出します。

### 2. 日付の書式を、数字の範囲に変える

```php:line-numbers=329
        $glob = str_replace(
            ['{filename}', '{date}'],
            [$fileInfo['filename'], str_replace(
                ['Y', 'y', 'm', 'd', 'H'],
                ['[0-9][0-9][0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]', '[0-9][0-9]'],
                $this->dateFormat
            )],
```

内側の `str_replace` で、日付の書式の記号を、対応する数字の範囲に変えます。`Y` は 4 つの数字、`m` と `d` と `H` は 2 つの数字になります。その結果を、外側の `str_replace` で `{date}` の位置に入れ、`{filename}` には元のファイル名を入れます。

### 3. フォルダと拡張子をつなぐ

```php:line-numbers=336
            self::appendDirectorySeparator($fileInfo['dirname'] ?? '') . $this->filenameFormat
        );
        if (isset($fileInfo['extension'])) {
            $glob .= '.'.$fileInfo['extension'];
        }

        return $glob;
```

フォルダの区切りをつけてから、`filenameFormat` をつなぎます。拡張子があれば末尾に付けて、完成したパターンを返します。

## ここがすごい

- 書式の記号を、数字の範囲に一対一で対応させています。日付の書き方を変えても、それに合う検索パターンが自動的に作られます。
- 同じ `str_replace` の形を使いまわして、ファイル名の組み立てを 2 つの関数で揃えています。`getTimedFilename` と見比べると、違いがよく分かります。
- 日付の部分だけを広げるので、ファイル名の他の部分は、そのまま一致させられます。違うログファイルを、誤って拾うことを防げます。
- 検索パターンを作る処理が 1 つの関数にまとまっているので、ログを削除する仕組みなど、別の場面からも同じ結果を使えます。

## まとめ

`getGlobPattern` は、日付の書式を数字の範囲に変えて、過去のログファイルを探すためのパターンを作る関数です。`getTimedFilename` で作るファイル名と、同じ組み立て方を使っているので、どの日のファイルも一貫して見つけられます。書式の記号を、検索の条件に読み替える、よく練られた変換です。
