---
title: 3661.5秒を「1 h, 1 min」に縮める、時間表示の工夫
description: Symfony Console の Helper::formatTime は、ミリ秒を単位の大きい順に分解し、指定した桁数だけを残して表示します。割り算と剰余を使い、0 の単位は飛ばします。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Helper/Helper.php
lines: [111, 151]
function: Helper::formatTime
difficulty: 3
format: 2
tags: [日時, 数値計算, 文字列処理]
---
## ひとことで

`formatTime` は、経過時間の秒数を「1 h, 1 min」のような人が読みやすい文字列に変える関数です。コマンドの実行時間をターミナルに表示するときに使われます。単位を大きいものから順に取り出し、`precision` で指定した数の単位だけを残します。

## コード

```php:line-numbers=111
    public static function formatTime(int|float $secs, int $precision = 1): string
    {
        $ms = (int) ($secs * 1000);
        $secs = (int) floor($secs);

        if (0 === $ms) {
            return '< 1 ms';
        }

        static $timeFormats = [
            [1, 'ms'],
            [1000, 's'],
            [60000, 'min'],
            [3600000, 'h'],
            [86_400_000, 'd'],
        ];

        $times = [];
        foreach ($timeFormats as $index => $format) {
            $milliSeconds = isset($timeFormats[$index + 1]) ? $ms % $timeFormats[$index + 1][0] : $ms;

            if (isset($times[$index - $precision])) {
                unset($times[$index - $precision]);
            }

            if (0 === $milliSeconds) {
                continue;
            }

            $unitCount = ($milliSeconds / $format[0]);
            $times[$index] = $unitCount.' '.$format[1];

            if ($ms === $milliSeconds) {
                break;
            }

            $ms -= $milliSeconds;
        }

        return implode(', ', array_reverse($times));
    }
```

## 前提知識

- **ミリ秒と秒**: 1 秒は 1000 ミリ秒です。`1 min` は 60000 ミリ秒、`1 h` は 3600000 ミリ秒です。
- **剰余 `%`**: 割った余りです。`3661000 % 60000` は `1000` になります。ある単位に満たない部分を取り出すのに使います。
- **`static` 変数**: 関数の中で宣言した変数を、呼び出しのあいだ保持する書き方です。ここでは単位の表を一度だけ作ります。
- **`foreach ($timeFormats as $index => $format)`**: 配列の番号（`$index`）と中身（`$format`）を同時に取り出すループです。
- **`array_reverse` と `implode`**: 配列の順番を逆にし、カンマでつないで 1 つの文字列にする関数です。
- **`int|float`**: 整数か小数のどちらかを受け取る型の指定です。

## 何をしているか

### 1. ミリ秒に換算する

```php:line-numbers=113
        $ms = (int) ($secs * 1000);
```

受け取った秒数を 1000 倍して、ミリ秒の整数にします。以降の計算は、すべてミリ秒で行います。

### 2. 単位の表を用意する

```php:line-numbers=120
        static $timeFormats = [
            [1, 'ms'],
            [1000, 's'],
            [60000, 'min'],
            [3600000, 'h'],
            [86_400_000, 'd'],
        ];
```

各行は「その単位が何ミリ秒か」と「単位の記号」の組です。小さい単位から大きい単位へ並んでいます。

### 3. 単位を大きい順に切り出す

```php:line-numbers=129
        foreach ($timeFormats as $index => $format) {
            $milliSeconds = isset($timeFormats[$index + 1]) ? $ms % $timeFormats[$index + 1][0] : $ms;
```

1 つの単位について、次の大きい単位に満たない部分を求めます。たとえば `ms` の段では、`$ms % 1000` で、1 秒に満たない端数（ミリ秒）が取れます。

ここで余りを取った値が、この単位で表す分です。取り出したら、`$ms -= $milliSeconds` で残りから引きます。

### 4. 指定の桁数より前の単位を消す

```php:line-numbers=132
            if (isset($times[$index - $precision])) {
                unset($times[$index - $precision]);
            }
```

`$precision` は残す単位の数です。`precision` が 1 のときは、新しい単位を追加する直前に、1 つ前の結果を消します。そのため、最後に残るのは最も大きい単位だけになります。

### 5. 計算結果を並べる

```php:line-numbers=147
            $ms -= $milliSeconds;
        }

        return implode(', ', array_reverse($times));
```

すべての単位が終わったら、結果を大きい順に並べ直して、カンマでつなぎます。

具体的な値で見てみます。3661.5 秒は 3661500 ミリ秒です。

- `precision` が 1 なら `1 h`
- `precision` が 2 なら `1 h, 1 min`
- `precision` が 3 なら `1 h, 1 min, 1 s`

## ここがすごい

- **単位の表で処理を一般化**: 単位ごとに `if` を書かず、表を 1 回ループします。単位を増やすときは表に 1 行足すだけです。
- **端数を残さない**: 大きい単位から引いていくので、同じ量を二重に数えません。
- **表示の桁数を呼び出し側が決める**: `precision` の値で、詳しく表示するか短くするかを選べます。
- **0 の単位は飛ばす**: 余りが 0 の単位は `continue` で読み飛ばし、「0 min」のような表示を防いでいます。
- **`< 1 ms` の特別扱い**: 0 ミリ秒の場合は、計算をせずに固定の文字を返します。

## まとめ

- 時間の表示は、ミリ秒を単位の表に従って大きい順に切り出すと作れる。
- 余りを使うと、各単位に満たない端数を取り出せる。
- 表示する単位の数を引数にすると、用途に合わせて詳しさを変えられる。
- 単位の定義を表にすると、処理を書き換えずに拡張できる。
