---
title: テスト用の現在時刻を、本物の時計に代わって返す
description: Carbon の getMockedTestNow は、setTestNow で決めた仮の現在時刻を取り出し、必要ならタイムゾーンを揃えます。テストの中で now() を固定できる仕組みの心臓部です。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/Traits/Test.php
lines: [123, 134]
function: Test::getMockedTestNow
difficulty: 3
format: 2
tags: [設計パターン, 日時, テスト]
---
## ひとことで

`getMockedTestNow` は、テストのために「今この時刻だとする」と決めた値を取り出す関数です。`Carbon::setTestNow()` で設定した値を使い、必要ならタイムゾーンに合わせて返します。設定されていなければ `null` を返し、本物の現在時刻を使う状態に戻ります。

## コード

```php:line-numbers=123
    protected static function getMockedTestNow(DateTimeZone|string|int|null $timezone): ?CarbonInterface
    {
        $testNow = FactoryImmutable::getInstance()->handleTestNowClosure(static::getTestNow(), $timezone);

        if ($testNow === null) {
            return null;
        }

        $testNow = $testNow->avoidMutation();

        return $timezone ? $testNow->setTimezone($timezone) : $testNow;
    }
```

## 前提知識

- **テストの固定時刻**: 「今日の日付」や「今の時刻」に依存する処理は、テストの実行日によって結果が変わります。時刻を固定すると、毎回同じ結果を確かめられます。
- **`protected static`**: クラスの中と、それを継承したクラスから呼べる、インスタンスを作らない関数です。
- **`null`**: 「値が無い」ことを表します。ここでは「固定時刻が設定されていない」の意味です。
- **`?CarbonInterface`**: 戻り値の型が `CarbonInterface` か `null` のどちらかであることを表す宣言です。`?` が `null` を許すという意味です。
- **`FactoryImmutable`**: 日時を作る工場に当たるクラスです。テスト用の時刻の設定は、この工場が持っています。
- **`handleTestNowClosure`**: 設定された値が「時刻を返す関数」だった場合に、それを実行して値を取り出します。

## 何をしているか

### 1. 設定された固定時刻を取り出す

```php:line-numbers=125
        $testNow = FactoryImmutable::getInstance()->handleTestNowClosure(static::getTestNow(), $timezone);
```

`static::getTestNow()` は、設定された固定時刻を返します。固定時刻が関数で与えられていれば、`handleTestNowClosure` がその関数を実行して値にします。引数の `$timezone` は、タイムゾーンを揃えるときに使われます。

### 2. 設定が無ければ null を返す

```php:line-numbers=127
        if ($testNow === null) {
            return null;
        }
```

固定時刻が設定されていない場合は、ここで終わります。呼び出し側は `null` を見て、本物の現在時刻を使います。

### 3. 元の値を書き換えない形にする

```php:line-numbers=131
        $testNow = $testNow->avoidMutation();
```

固定時刻を、書き換えられない形に整えます。テストの途中で誰かが時刻を変えても、設定された元の値は影響を受けません。

### 4. タイムゾーンを揃えて返す

```php:line-numbers=133
        return $timezone ? $testNow->setTimezone($timezone) : $testNow;
```

タイムゾーンが指定されていれば、その地域の時刻に変換して返します。指定が無ければ、設定された時刻をそのまま返します。

## ここがすごい

- **本物の時計を差し替える**: 日時を作る処理のどこからでも、この関数を通して時刻を取るので、テストで 1 か所を設定すれば全体が固定されます。
- **元の設定を守る**: `avoidMutation` で、取り出した値が元の設定を書き換えないようにしています。テストの途中で時刻を進めても、他のテストに影響しません。
- **`null` で「本物を使う」を表す**: 設定の有無を `null` で表すので、通常の利用では余計な処理が増えません。テスト用の機能が、本番の動作を変えないようになっています。
- **タイムゾーンの扱いを 1 か所に**: 変換の処理を、この関数で統一しています。呼び出し側が個別に変換する必要がありません。

## まとめ

- テストで時刻を固定するには、「現在時刻を取る」処理を 1 つの入口にまとめるとよい。
- 固定時刻が無いときは `null` を返し、本物の時計に戻す。
- 取り出した値は書き換えられない形にして、テストの中で設定が変わらないようにする。
- タイムゾーンの変換は、入口で 1 回だけ行うと扱いやすい。
