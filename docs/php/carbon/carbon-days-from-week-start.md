---
title: 週の始まりが何日目かを、剰余で求める
description: Carbon の getDaysFromStartOfWeek は、週の始まりの曜日を基準に、今日が何日目かを 1 行の剰余計算で返します。週の始まりを日曜にするか月曜にするかを、設定だけで切り替えられます。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/Traits/Date.php
lines: [1680, 1685]
function: Date::getDaysFromStartOfWeek
difficulty: 2
format: 2
tags: [日時, ビット演算, 数値計算]
---
## ひとことで

`getDaysFromStartOfWeek` は、日付が「その週の始まりから何日目か」を 0 から 6 の整数で返すメソッドです。週の始まりを日曜にするか月曜にするかは、ロケールの設定や引数で決まります。カレンダーの表示で、週の列の位置を求めるときに役立ちます。

## コード

```php:line-numbers=1680
    public function getDaysFromStartOfWeek(WeekDay|int|null $weekStartsAt = null): int
    {
        $firstDay = (int) (WeekDay::int($weekStartsAt) ?? $this->getTranslationMessage('first_day_of_week') ?? 0);

        return ($this->dayOfWeek + 7 - $firstDay) % 7;
    }
```

## 前提知識

- **曜日の番号**: PHP の `dayOfWeek` は、日曜が `0`、月曜が `1`、……土曜が `6` です。
- **剰余 `%`**: 割った余りを返す演算子です。`9 % 7` は `2` になります。
- **`??`（null 合体演算子）**: 左側が `null` のときだけ、右側の値を使います。`A ?? B ?? 0` は、A が無ければ B、B も無ければ 0 を使う、という意味です。
- **`(int)`**: 値を整数に変換するキャストです。
- **`WeekDay`**: 曜日を表す Carbon の型です。`WeekDay::int(...)` は、その値を整数に直します。

## 何をしているか

### 1. 週の始まりの曜日を決める

```php:line-numbers=1682
        $firstDay = (int) (WeekDay::int($weekStartsAt) ?? $this->getTranslationMessage('first_day_of_week') ?? 0);
```

優先順位は次のとおりです。

1. 引数の `$weekStartsAt` が指定されていれば、それを使います。
2. 無ければ、日付のロケール（言語や地域）に合わせた週の始まり（`first_day_of_week`）を使います。
3. どちらも無ければ `0`（日曜）にします。

`(int)` で整数に揃えてから、次の計算に使います。

### 2. 剰余で差を求める

```php:line-numbers=1684
        return ($this->dayOfWeek + 7 - $firstDay) % 7;
```

ここが中心の計算です。`$this->dayOfWeek` から `$firstDay` を引くと、週の始まりからの差になります。ただし、引き算の結果が負になることがあるので、`+ 7` をしてから `% 7` で 0〜6 の範囲に戻します。

具体的に見てみます。

- 水曜（`dayOfWeek` は 3）で、週の始まりが月曜（`firstDay` は 1）のとき。`(3 + 7 - 1) % 7 = 9 % 7 = 2` です。水曜は月曜から 2 日目です。
- 日曜（`dayOfWeek` は 0）で、週の始まりが月曜（`firstDay` は 1）のとき。`(0 + 7 - 1) % 7 = 6` です。日曜は、月曜から見て 6 日後です。

## ここがすごい

- **負の数を作らない**: `dayOfWeek - firstDay` は負になることがあります。`+ 7` で必ず正にしてから剰余を取る書き方は、「週は 7 日で循環する」という性質をそのまま使っています。
- **1 行で済む**: 曜日の表を用意して照らし合わせる書き方もできます。ここでは算術だけで、どの週の始まりにも対応できます。
- **設定の優先順位が明確**: 引数、ロケール、既定値の順に決まるので、呼ぶ側は必要なところだけを指定すれば済みます。
- **型を揃えてから計算する**: `(int)` で整数に揃えてから計算するので、文字列の数字が混ざっても誤った結果になりにくくしています。

## まとめ

- 週の循環は、`(曜日 - 週の始まり + 7) % 7` という剰余で表せる。
- 負になる差は、7 を足してから剰余を取ると 0〜6 に収まる。
- 週の始まりは、引数、ロケール、既定値の順で決めると扱いやすい。
- 曜日の番号は言語の仕様によって違うので、ライブラリ側で揃えてから計算する。
