---
title: 日付を入れたログファイルの名前を作る
description: Monolog の RotatingFileHandler の getTimedFilename は、{date} や {filename} の印を、今日の日付と元のファイル名に置き換えて、ログファイルの名前を作ります。日ごとにファイルを分けるための、名前の組み立て部分です。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/RotatingFileHandler.php
lines: [175, 189]
function: getTimedFilename
difficulty: 2
format: 2
tags: [ファイル, 日時, 文字列処理]
---
## ひとことで

`getTimedFilename` は、日付ごとにログを分けるファイルの名前を、その時点の日付で作る関数です。設定が `app-{date}.log` のようになっていれば、`app-2026-11-02.log` のような名前になります。ログを日ごとに分けて、後から探しやすくするための仕組みです。

## コード

```php:line-numbers=175
    protected function getTimedFilename(): string
    {
        $fileInfo = pathinfo($this->filename);
        $timedFilename = str_replace(
            ['{filename}', '{date}'],
            [$fileInfo['filename'], (new \DateTimeImmutable(timezone: $this->timezone))->format($this->dateFormat)],
            self::appendDirectorySeparator($fileInfo['dirname'] ?? '') . $this->filenameFormat
        );

        if (isset($fileInfo['extension'])) {
            $timedFilename .= '.'.$fileInfo['extension'];
        }

        return $timedFilename;
    }
```

## 前提知識

- **ローテーション**: ログのファイルを、一定の間隔で新しいファイルに切り替えることです。古いログは残しつつ、ファイルが大きくなりすぎないようにします。
- **`pathinfo`**: パスを、フォルダ名、ファイル名、拡張子などに分けて、配列で返す関数です。
- **`str_replace`**: 文字列の中の印を、別の文字列に置き換える関数です。配列で複数の印を、一度に置き換えられます。
- **`DateTimeImmutable`**: 日時を表すクラスで、変更されないのが特徴です。`timezone` の引数で、どの時間帯の日付にするかを決められます。
- **名前付き引数**: `timezone: ...` のように、引数の名前を指定して渡す書き方です。順番を気にせずに済みます。

## 何をしているか

### 1. 元のファイル名を分ける

```php:line-numbers=177
        $fileInfo = pathinfo($this->filename);
```

`pathinfo` で、設定されたファイルのパスを分けます。フォルダ名（`dirname`）、ファイル名（`filename`）、拡張子（`extension`）などが、配列の中に入ります。

### 2. 印を、日付とファイル名に置き換える

```php:line-numbers=178
        $timedFilename = str_replace(
            ['{filename}', '{date}'],
            [$fileInfo['filename'], (new \DateTimeImmutable(timezone: $this->timezone))->format($this->dateFormat)],
            self::appendDirectorySeparator($fileInfo['dirname'] ?? '') . $this->filenameFormat
        );
```

`{filename}` は元のファイル名に、`{date}` は今日の日付に置き換えます。日付の書式は `dateFormat` で決まります。置き換えの対象は、元のフォルダの名前に `filenameFormat` をつないだ文字列です。フォルダを表す部分は、`appendDirectorySeparator` で区切りを整えてから、先頭に付けられます。

### 3. 拡張子を付け足す

```php:line-numbers=184
        if (isset($fileInfo['extension'])) {
            $timedFilename .= '.'.$fileInfo['extension'];
        }
```

元のパスに拡張子があれば、それを末尾に付けます。`{date}` のような印で書かれた部分と、拡張子を、別々に管理できる作りです。

### 4. 完成した名前を返す

```php:line-numbers=188
        return $timedFilename;
```

完成したファイル名を、そのまま返します。

## ここがすごい

- 日付の書式と、名前の書式を分けているので、利用者は好きな形で日付を入れられます。たとえば `Y-m-d` でも `Ymd` でも、同じ仕組みで動きます。
- 日付を `timezone` で指定した時間帯にしているので、サーバーの設定にかかわらず、利用者の時間帯で日が変わります。
- `str_replace` に配列を渡して、2 つの印を 1 回の呼び出しで置き換えています。読みやすく、置き換えの順番による誤りも起きにくくなっています。
- 拡張子を最後に足すことで、`{date}` を含む名前の途中に、拡張子を混ぜずに済みます。

## まとめ

`getTimedFilename` は、設定の印を今日の日付と元のファイル名で置き換えて、ログファイルの名前を作る関数です。`pathinfo` で部品に分け、`str_replace` で組み立て直します。ログを日ごとに分けるという、ローテーションの基本を、名前の作り方として表しています。
