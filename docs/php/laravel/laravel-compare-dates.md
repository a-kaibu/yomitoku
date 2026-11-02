---
title: 二つの日付の前後関係を比べて、検証を行う
description: Laravel の compareDates は、入力された日付が別の日付より前か後かを確かめる検証の共通部分です。日付の書式が指定されていれば書式どおりに、そうでなければタイムスタンプに直して、比較の演算子で判定します。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Validation/Concerns/ValidatesAttributes.php
lines: [275, 290]
function: compareDates
difficulty: 3
format: 2
tags: [日時, 型システム, 防御的プログラミング]
---
## ひとことで

`compareDates` は、フォームの日付が別の日付より後か前かを確かめる検証ルールの共通部分です。`after`、`before` などのルールは、どれもこの関数を使い、比べ方（演算子）だけを変えて呼び出します。日付の比べ方を 1 か所にまとめるための関数です。

## コード

```php:line-numbers=275
    protected function compareDates($attribute, $value, $parameters, $operator)
    {
        if (! is_string($value) && ! is_numeric($value) && ! $value instanceof DateTimeInterface) {
            return false;
        }

        if ($format = $this->getDateFormat($attribute)) {
            return $this->checkDateTimeOrder($format, $value, $parameters[0], $operator);
        }

        if (is_null($date = $this->getDateTimestamp($parameters[0]))) {
            $date = $this->getDateTimestamp($this->getValue($parameters[0]));
        }

        return $this->compare($this->getDateTimestamp($value), $date, $operator);
    }
```

## 前提知識

- **タイムスタンプ**: 日時を、1970 年 1 月 1 日からの秒数で表した数です。数字なので、大きさを比べれば前後関係が分かります。
- **`DateTimeInterface`**: PHP で日時を表すクラスの共通の型です。`DateTime` や `DateTimeImmutable` が、これを実装しています。
- **書式（フォーマット）**: `Y-m-d` のように、日付の文字列の形を決める書き方です。`date_format` ルールで指定できます。
- **演算子の文字列**: `<`、`>`、`<=` などの比べ方を、文字列で渡す方法です。`compare` の中で、これに応じて比べ方を選びます。
- **ルールの引数**: `after:start_date` のように、比べる相手の項目名や日付を、ルールの後ろに書いたものです。

## 何をしているか

### 1. 日付として扱えない値は、比べずに失敗にする

```php:line-numbers=277
        if (! is_string($value) && ! is_numeric($value) && ! $value instanceof DateTimeInterface) {
            return false;
        }
```

最初の `if` で、値が文字列でも数値でも `DateTimeInterface` でもなければ、`false` を返します。日付として読めない値を、比べる前に落としています。

### 2. 書式が指定されていれば、その書式で比べる

```php:line-numbers=281
        if ($format = $this->getDateFormat($attribute)) {
            return $this->checkDateTimeOrder($format, $value, $parameters[0], $operator);
        }
```

`$this->getDateFormat($attribute)` で、この項目に書式が指定されているかを調べます。指定されていれば、`checkDateTimeOrder($format, $value, $parameters[0], $operator)` で、その書式に従って比べます。

### 3. 比べる相手の日付を求める

```php:line-numbers=285
        if (is_null($date = $this->getDateTimestamp($parameters[0]))) {
            $date = $this->getDateTimestamp($this->getValue($parameters[0]));
        }
```

書式がない場合、`getDateTimestamp($parameters[0])` で、引数をそのまま日時として読みます。読めなかった（`null` が返った）場合は、`getValue($parameters[0])` で、引数の名前を別の入力項目の名前とみなし、その項目の値を取り出して、日時として読みます。

### 4. 両方をタイムスタンプにして比べる

```php:line-numbers=289
        return $this->compare($this->getDateTimestamp($value), $date, $operator);
```

最後に、検証対象の値と比べる相手を、どちらもタイムスタンプに直して `compare` に渡します。`$operator` によって、「より前」か「より後」かなどが決まります。

## ここがすごい

- 日付の比べ方を、書式つきの場合とない場合で分けつつ、入り口の型チェックは 1 か所だけに置いています。すべての日付ルールが、同じ入口を通ります。
- 比べる相手を、「日付の文字列」と「ほかの入力項目の名前」の両方として読めるようにしています。`after:2024-01-01` と `after:start_date` を、同じ書き方で扱えます。
- 日付を最後にタイムスタンプへ直して比べるので、書式や時差の違いを、比較の段階で気にしなくて済みます。
- 戻り値の型が `bool` に限られるので、各ルールは結果をそのまま判定に使えます。

## まとめ

`compareDates` は、2 つの日付を比べて、指定された前後関係が成り立つかを返す検証の共通部分です。書式の指定、ほかの項目への参照、タイムスタンプへの変換という 3 つの段階を、短い条件分岐で順に進めています。`after` や `before` といった多くのルールが、この 1 つの関数の上に成り立っている点が、読みどころです。
