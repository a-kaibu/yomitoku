---
title: 時差の数字を「+09:30」のような文字列に変える
description: WordPress の wp_timezone_string は、タイムゾーン名がない場合に、GMT からの時差を +09:00 のような文字列にします。小数の時差（30 分単位）を分に直す計算が見どころです。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/functions.php
lines: [128, 145]
function: wp_timezone_string
difficulty: 2
format: 2
tags: [日時, 文字列処理]
---

## ひとことで

`wp_timezone_string` は、WordPress の設定から **タイムゾーンを表す文字列** を返す関数です。`Asia/Tokyo` のような名前が設定されていればそれを返し、名前がなければ `+09:00` のような時差の形にして返します。

## コード

```php:line-numbers=128
function wp_timezone_string() {
	$timezone_string = get_option( 'timezone_string' );

	if ( $timezone_string ) {
		return $timezone_string;
	}

	$offset  = (float) get_option( 'gmt_offset' );
	$hours   = (int) $offset;
	$minutes = ( $offset - $hours );

	$sign      = ( $offset < 0 ) ? '-' : '+';
	$abs_hour  = abs( $hours );
	$abs_mins  = abs( $minutes * 60 );
	$tz_offset = sprintf( '%s%02d:%02d', $sign, $abs_hour, $abs_mins );

	return $tz_offset;
}
```

## 前提知識

- **タイムゾーン**: 地域ごとの時刻のずれを表す設定です。日本は UTC より 9 時間進んでいます。
- **GMT オフセット**: UTC（協定世界時）からどれだけ時刻がずれているかの数字です。`5.5` は「5 時間 30 分」を表します。
- **`sprintf`**: 書式を指定して文字列を作る関数です。`%02d` は、整数を 2 桁で 0 埋めして表します。
- **`abs`**: 数値の絶対値（符号を外した値）を返す関数です。
- **`(int)` / `(float)`**: 値を整数や小数に変換するキャストです。

## 何をしているか

### 1. 名前が設定されていれば、それを返す

```php:line-numbers=129
	$timezone_string = get_option( 'timezone_string' );

	if ( $timezone_string ) {
		return $timezone_string;
	}
```

`timezone_string` の設定を取り出します。値があれば、それをそのまま返します。`Asia/Tokyo` のような正式な名前があれば、それが最も正確だからです。

### 2. 時差を、時と分に分ける

```php:line-numbers=135
	$offset  = (float) get_option( 'gmt_offset' );
	$hours   = (int) $offset;
	$minutes = ( $offset - $hours );
```

`gmt_offset` は小数です。`(int) $offset` で整数の時間を取り出し、`$offset - $hours` で残りの分（小数）を求めます。たとえば `5.5` なら、時間は `5`、残りは `0.5` です。

### 3. 符号と桁をそろえて、文字列にする

```php:line-numbers=139
	$sign      = ( $offset < 0 ) ? '-' : '+';
	$abs_hour  = abs( $hours );
	$abs_mins  = abs( $minutes * 60 );
	$tz_offset = sprintf( '%s%02d:%02d', $sign, $abs_hour, $abs_mins );
```

負の値なら符号は `-`、そうでなければ `+` にします。時と分は `abs` で符号を外してから、`sprintf('%s%02d:%02d', ...)` で `+05:30` の形にします。分は `$minutes * 60` で、0.5 時間を 30 分に直しています。

具体例で確かめると、`gmt_offset` が `-3.5` のとき、符号は `-`、時間は `3`、分は `30` になり、`-03:30` が返ります。

## ここがすごい

### 小数の時差を、整数の計算に直している

時差の `5.5` は、そのままでは「時間」と「分」が分かれていません。この関数は、整数部分を `(int)` で取り出し、残りの小数に 60 を掛けて分に直します。小数の計算を 1 か所に寄せることで、表示の桁ずれを防いでいます。

### 符号は一度だけ決めて、あとは絶対値で表示する

負の時差は、符号を `-` にして、時と分の数字はそのまま絶対値で表示します。もし負の数のまま `sprintf` に渡すと、`-3:-30` のような表記になってしまいます。符号と数字を分けておくことで、正しい形になります。

### `sprintf` で 2 桁にそろえる

`%02d` を使うことで、`9` は `09` に、`0` は `00` になります。時刻の表記としてそろった見た目になるので、画面の表示が整います。

## まとめ

- 小数の時間は、整数部分と残りを分けると、分の計算がわかりやすい。
- 符号は先に決めて、数字は絶対値で扱うと、表記の間違いを防げる。
- `sprintf` の `%02d` で 2 桁の 0 埋めができ、時刻の表示がそろう。
- 名前がある場合はその名前を優先すると、夏時間などの正確さも保てる。
